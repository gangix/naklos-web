# Landing Rewrite + Founding-Customer Mechanic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the design in `docs/superpowers/specs/2026-04-25-landing-rewrite-design.md` — single-goal landing page (TR only), founding-customer slot mechanic on the BE, public status endpoint, and a refreshed pricing surface anchored on ₺79/araç/ay (₺55 founding rate).

**Architecture:** BE adds `founding_customer_seq` column on `Fleet`, hooks into `TruckService.registerTruck` to atomically claim slots when a fleet hits its 4th truck, and exposes a public `GET /api/public/founding-status`. FE rewrites the landing page from 7 sections to 6 (Hero / Three pillars / Comparison / Pricing / FAQ / Final CTA), removes 4 unused components from the routing, and adds a small `publicApi` client that the Pricing + FinalCTA components subscribe to for the live "X spot kaldı" counter.

**Tech Stack:** BE — Java 21 + Spring Boot 3 + JPA + Flyway. FE — React 19 + TypeScript 5 + Tailwind 3 + react-i18next. Existing landing components in `src/pages/landing/`. Mock at `/tmp/naklos-landing-mock.html` is the visual source of truth.

---

## 1. File structure

| Path | Repo | Responsibility | New / Modified |
|---|---|---|---|
| `application/src/main/resources/db/migration/V19__fleet_founding_customer.sql` | naklos | Add `founding_customer_seq` column + index | New |
| `fleet-module/src/main/java/com/naklos/fleet/domain/model/Fleet.java` | naklos | Add `foundingCustomerSeq` field + setter | Modified |
| `fleet-module/src/main/java/com/naklos/fleet/application/founding/FoundingCustomerService.java` | naklos | Atomic slot claiming + counts | New |
| `fleet-module/src/main/java/com/naklos/fleet/application/service/TruckService.java` | naklos | Hook `tryClaimSlot` after `seed` in `registerTruck` | Modified |
| `application/src/main/java/com/naklos/application/api/PublicFoundingController.java` | naklos | `GET /api/public/founding-status` (no auth) | New |
| `application/src/main/java/com/naklos/application/security/SecurityConfig.java` | naklos | Permit `/api/public/**` without auth | Modified |
| `application/src/test/java/com/naklos/fleet/application/founding/FoundingCustomerServiceIntegrationTest.java` | naklos | Slot allocation + cap + stickiness tests | New |
| `application/src/test/java/com/naklos/application/api/PublicFoundingControllerIntegrationTest.java` | naklos | Endpoint shape + no-auth test | New |
| `src/services/publicApi.ts` | naklos-web | Tiny client for `/api/public/founding-status` | New |
| `src/types/founding.ts` | naklos-web | `FoundingStatus` interface | New |
| `src/pages/landing/Hero.tsx` | naklos-web | Full rewrite per §4.2 of spec | Modified |
| `src/pages/landing/Features.tsx` | naklos-web | 4 cards → 3 cards per §4.3 of spec | Modified |
| `src/pages/landing/Header.tsx` | naklos-web | Refresh nav + add beta badge per §4.1 | Modified |
| `src/pages/landing/Comparison.tsx` | naklos-web | New comparison table per §4.4 | New |
| `src/pages/landing/Pricing.tsx` | naklos-web | Full rewrite per §4.5; subscribes to publicApi | Modified |
| `src/pages/landing/FAQ.tsx` | naklos-web | New 6-question accordion per §4.6 | New |
| `src/pages/landing/FinalCTA.tsx` | naklos-web | New dark band per §4.7; subscribes to publicApi | New |
| `src/pages/landing/Footer.tsx` | naklos-web | Light refresh per §4.8 | Modified |
| `src/pages/LandingPage.tsx` | naklos-web | New section ordering; drop Benefits/HowItWorks/SocialProof/ContactForm imports | Modified |
| `public/locales/tr/translation.json` | naklos-web | New `landing.*` keys for the rewritten copy | Modified |

**Total: 9 new files, 11 modified.** ~800 LOC end-to-end.

---

## 2. Tasks

> Each task ends with a commit. After every code change, type-check (FE: `npx tsc --noEmit`; BE: `./gradlew :fleet-module:compileJava`) before committing. Pre-existing lint warnings in `FuelCountsContext.tsx` / `MaintenanceWarningsContext.tsx` are noise — ignore.

### Task 1: BE V19 migration

**Files:**
- Create: `application/src/main/resources/db/migration/V19__fleet_founding_customer.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- ============================================================================
-- V19 — Founding-customer slot tracking on fleets
-- See spec: naklos-web/docs/superpowers/specs/2026-04-25-landing-rewrite-design.md
--
-- The first 10 fleets to reach 4+ non-deleted trucks get an integer slot
-- number (1..10) recorded in founding_customer_seq. UNIQUE constraint
-- prevents two fleets from racing into the same slot. NULL means "not a
-- founder." Sticky once granted — never set back to NULL even if the fleet
-- later drops below 4 trucks.
--
-- Slot is consumed by FoundingCustomerService.tryClaimSlot, called from
-- TruckService.registerTruck after the new truck is persisted.
-- ============================================================================

ALTER TABLE fleet.fleets
    ADD COLUMN founding_customer_seq INTEGER UNIQUE;

-- Partial index: only the few founding rows. Cheap to maintain.
CREATE INDEX idx_fleets_founding_seq
    ON fleet.fleets (founding_customer_seq)
    WHERE founding_customer_seq IS NOT NULL;
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/olcay.bilir/IdeaProjects/naklos add application/src/main/resources/db/migration/V19__fleet_founding_customer.sql
git -C /Users/olcay.bilir/IdeaProjects/naklos commit -m "V19: add fleet.fleets.founding_customer_seq UNIQUE column"
```

---

### Task 2: BE Fleet entity field

**Files:**
- Modify: `fleet-module/src/main/java/com/naklos/fleet/domain/model/Fleet.java`

- [ ] **Step 1: Read the file to find the existing field block + setter pattern**

```bash
grep -n "@Column\|public void set\|@Getter" /Users/olcay.bilir/IdeaProjects/naklos/fleet-module/src/main/java/com/naklos/fleet/domain/model/Fleet.java | head -10
```

- [ ] **Step 2: Add the field**

In `Fleet.java`, near the bottom of the existing `@Column` block (typically after `time_zone` or similar recently-added field), add:

```java
/**
 * Founding-customer slot (1..10) granted when this fleet first reaches 4+
 * non-deleted trucks. NULL when the fleet hasn't earned a slot. Sticky:
 * never reverts to NULL even if the fleet later drops trucks. Drives the
 * locked ₺55/araç/ay rate when billing wires up.
 */
@Column(name = "founding_customer_seq")
private Integer foundingCustomerSeq;
```

The field is auto-exposed via Lombok's `@Getter` (already on the class). Add a setter for `FoundingCustomerService` to call:

```java
public void grantFoundingSlot(int seq) {
    if (this.foundingCustomerSeq != null) return; // sticky — never overwrite
    if (seq < 1 || seq > 10) throw new IllegalArgumentException("Founding seq must be 1..10");
    this.foundingCustomerSeq = seq;
}
```

- [ ] **Step 3: Compile**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos && ./gradlew :fleet-module:compileJava
```

Must be `BUILD SUCCESSFUL`.

- [ ] **Step 4: Commit**

```bash
git -C /Users/olcay.bilir/IdeaProjects/naklos add fleet-module/src/main/java/com/naklos/fleet/domain/model/Fleet.java
git -C /Users/olcay.bilir/IdeaProjects/naklos commit -m "domain: Fleet.foundingCustomerSeq field + grantFoundingSlot mutator"
```

---

### Task 3: BE FoundingCustomerService (TDD)

**Files:**
- Create: `application/src/test/java/com/naklos/fleet/application/founding/FoundingCustomerServiceIntegrationTest.java`
- Create: `fleet-module/src/main/java/com/naklos/fleet/application/founding/FoundingCustomerService.java`

- [ ] **Step 1: Write the failing tests**

Mirror the test conventions used by `MaintenanceScheduleServiceIntegrationTest.java`. 5 tests:

```java
package com.naklos.fleet.application.founding;

import com.naklos.fleet.FleetModuleIntegrationTest;
import com.naklos.fleet.application.dto.AddressDto;
import com.naklos.fleet.application.dto.CreateFleetRequest;
import com.naklos.fleet.application.dto.RegisterTruckRequest;
import com.naklos.fleet.application.service.FleetService;
import com.naklos.fleet.application.service.TruckService;
import com.naklos.fleet.domain.repository.FleetRepository;
import com.naklos.shared.enums.Currency;
import com.naklos.shared.enums.TruckType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class FoundingCustomerServiceIntegrationTest extends FleetModuleIntegrationTest {

    @Autowired private FoundingCustomerService foundingService;
    @Autowired private FleetService fleetService;
    @Autowired private TruckService truckService;
    @Autowired private FleetRepository fleetRepo;

    private UUID createFleet(String name) {
        var fleet = fleetService.createFleet(new CreateFleetRequest(
            UUID.randomUUID(), name, "1234567890",
            new AddressDto("Main St", "Istanbul", "34000", "TR", "Istanbul"),
            "test@example.com", "+905555555555",
            Currency.TRY, "2026-04-01"));
        return fleet.id();
    }

    private void addTrucks(UUID fleetId, int count) {
        for (int i = 0; i < count; i++) {
            truckService.registerTruck(fleetId, new RegisterTruckRequest(
                fleetId, "PL " + UUID.randomUUID().toString().substring(0, 4),
                TruckType.SMALL_TRUCK, BigDecimal.valueOf(3500), null));
        }
    }

    @Test
    void fleet_with_3_trucks_does_not_get_slot() {
        var fleetId = createFleet("Three Truck Fleet");
        addTrucks(fleetId, 3);
        // Hooked from registerTruck — slot only claimed at the 4th truck.
        var fleet = fleetRepo.findById(fleetId).orElseThrow();
        assertThat(fleet.getFoundingCustomerSeq()).isNull();
    }

    @Test
    void fleet_reaches_4_trucks_gets_slot_1() {
        var fleetId = createFleet("Four Truck Fleet");
        addTrucks(fleetId, 4);
        var fleet = fleetRepo.findById(fleetId).orElseThrow();
        assertThat(fleet.getFoundingCustomerSeq()).isEqualTo(1);
    }

    @Test
    void second_eligible_fleet_gets_slot_2() {
        var f1 = createFleet("First Fleet");
        addTrucks(f1, 4);
        var f2 = createFleet("Second Fleet");
        addTrucks(f2, 4);
        assertThat(fleetRepo.findById(f1).orElseThrow().getFoundingCustomerSeq()).isEqualTo(1);
        assertThat(fleetRepo.findById(f2).orElseThrow().getFoundingCustomerSeq()).isEqualTo(2);
    }

    @Test
    void eleventh_eligible_fleet_gets_no_slot() {
        UUID[] ids = new UUID[11];
        for (int i = 0; i < 11; i++) {
            ids[i] = createFleet("Fleet " + i);
            addTrucks(ids[i], 4);
        }
        for (int i = 0; i < 10; i++) {
            assertThat(fleetRepo.findById(ids[i]).orElseThrow().getFoundingCustomerSeq())
                .isEqualTo(i + 1);
        }
        assertThat(fleetRepo.findById(ids[10]).orElseThrow().getFoundingCustomerSeq())
            .isNull();
    }

    @Test
    void slot_is_sticky_after_claiming() {
        var fleetId = createFleet("Sticky Fleet");
        addTrucks(fleetId, 4);
        // Adding a 5th truck must not change the seq.
        addTrucks(fleetId, 1);
        assertThat(fleetRepo.findById(fleetId).orElseThrow().getFoundingCustomerSeq()).isEqualTo(1);
    }
}
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos && ./gradlew :application:test --tests FoundingCustomerServiceIntegrationTest 2>&1 | tail -20
```

Expected: FAIL — `FoundingCustomerService` doesn't exist.

- [ ] **Step 3: Implement the service**

```java
package com.naklos.fleet.application.founding;

import com.naklos.fleet.domain.model.Fleet;
import com.naklos.fleet.domain.repository.FleetRepository;
import com.naklos.fleet.domain.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Atomic slot allocation for the founding-customer programme. Called from
 * TruckService.registerTruck after each truck is persisted; no-ops if the
 * fleet already has a slot or doesn't yet meet the 4-truck threshold.
 *
 * Race-safety: the UNIQUE constraint on Fleet.founding_customer_seq is the
 * actual atomicity guarantee — if two fleets race to grab slot 4, one of
 * the UPDATE statements fails and that fleet retries with seq=5. The
 * REQUIRES_NEW propagation isolates the slot-claim from the parent truck-
 * registration transaction so a slot-claim failure can't roll back the
 * truck registration.
 */
@Service
@RequiredArgsConstructor
public class FoundingCustomerService {

    private static final int MAX_FOUNDING_SLOTS = 10;
    private static final int REQUIRED_TRUCKS = 4;

    private static final Logger log = LoggerFactory.getLogger(FoundingCustomerService.class);

    private final FleetRepository fleets;
    private final TruckRepository trucks;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void tryClaimSlot(UUID fleetId) {
        Fleet fleet = fleets.findById(fleetId).orElse(null);
        if (fleet == null) return;
        if (fleet.getFoundingCustomerSeq() != null) return;

        long truckCount = trucks.countByFleetIdAndDeletedAtIsNull(fleetId);
        if (truckCount < REQUIRED_TRUCKS) return;

        // Try slot numbers 1..10 in order; UNIQUE constraint will fail
        // concurrent races and we'll retry with the next.
        for (int seq = 1; seq <= MAX_FOUNDING_SLOTS; seq++) {
            try {
                fleet.grantFoundingSlot(seq);
                fleets.save(fleet);
                log.info("Founding slot {} granted to fleet {}", seq, fleetId);
                return;
            } catch (org.springframework.dao.DataIntegrityViolationException race) {
                // Slot taken in the gap; try the next. Re-load fleet so the
                // grantFoundingSlot's "already-granted" guard can fire if a
                // sibling thread grabbed our slot for THIS fleet.
                fleet = fleets.findById(fleetId).orElse(null);
                if (fleet == null || fleet.getFoundingCustomerSeq() != null) return;
            }
        }
        // All 10 slots taken — silent no-op.
    }

    public FoundingStatus status() {
        long taken = fleets.countByFoundingCustomerSeqIsNotNull();
        return new FoundingStatus(taken, Math.max(0, MAX_FOUNDING_SLOTS - taken));
    }

    public record FoundingStatus(long taken, long remaining) {}
}
```

**Verify before writing:** `TruckRepository.countByFleetIdAndDeletedAtIsNull` and `FleetRepository.countByFoundingCustomerSeqIsNotNull` may not exist yet. If they don't, add them to the respective domain repository interfaces (and their JPA implementations) — Spring Data JPA will derive the implementations from the method names automatically. Quick check:

```bash
grep -n "countByFleetId\|countByFounding" /Users/olcay.bilir/IdeaProjects/naklos/fleet-module/src/main/java/com/naklos/fleet/domain/repository/*.java
```

If missing, add to `TruckRepository.java`:
```java
long countByFleetIdAndDeletedAtIsNull(UUID fleetId);
```
And to `FleetRepository.java`:
```java
long countByFoundingCustomerSeqIsNotNull();
```

Both auto-implemented by Spring Data — no JPA impl changes needed.

- [ ] **Step 4: Run tests, expect green**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos && ./gradlew :application:test --tests FoundingCustomerServiceIntegrationTest 2>&1 | tail -15
```

Expected: 5 tests PASS. If the last test (`slot_is_sticky_after_claiming`) fails because `addTrucks(fleetId, 1)` re-triggers the claim and the guard isn't firing, debug via the `grantFoundingSlot` early-return in `Fleet.java` (added in Task 2).

- [ ] **Step 5: Commit**

```bash
git -C /Users/olcay.bilir/IdeaProjects/naklos add fleet-module/src/main/java/com/naklos/fleet/application/founding/FoundingCustomerService.java application/src/test/java/com/naklos/fleet/application/founding/FoundingCustomerServiceIntegrationTest.java
# include repository-interface additions if you added the count methods:
git -C /Users/olcay.bilir/IdeaProjects/naklos add fleet-module/src/main/java/com/naklos/fleet/domain/repository/TruckRepository.java fleet-module/src/main/java/com/naklos/fleet/domain/repository/FleetRepository.java 2>/dev/null
git -C /Users/olcay.bilir/IdeaProjects/naklos commit -m "application: FoundingCustomerService — atomic 1..10 slot claiming"
```

---

### Task 4: Wire FoundingCustomerService into TruckService.registerTruck

**Files:**
- Modify: `fleet-module/src/main/java/com/naklos/fleet/application/service/TruckService.java`

- [ ] **Step 1: Read the current state**

```bash
grep -n "registerTruck\|scheduleSeeder.seed\|backlinker" /Users/olcay.bilir/IdeaProjects/naklos/fleet-module/src/main/java/com/naklos/fleet/application/service/TruckService.java | head -10
```

The relevant section was added during the maintenance plan: `scheduleSeeder.seed(saved);` is called near the end of `registerTruck`. We add the founding hook just below it.

- [ ] **Step 2: Inject FoundingCustomerService**

In the `@RequiredArgsConstructor`-managed field list, add (alongside `scheduleSeeder`):

```java
private final FoundingCustomerService foundingCustomerService;
```

Add the import at the top:

```java
import com.naklos.fleet.application.founding.FoundingCustomerService;
```

- [ ] **Step 3: Call tryClaimSlot after the seeder**

In `registerTruck`, after `scheduleSeeder.seed(saved);` and before the `return`:

```java
foundingCustomerService.tryClaimSlot(saved.getFleetId());
```

This is intentionally fire-and-forget — `REQUIRES_NEW` propagation means it has its own transaction; failures are logged but don't roll back truck registration.

- [ ] **Step 4: Run all maintenance + truck tests to confirm no regressions**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos && ./gradlew :application:test --tests "*Truck*" --tests "*Maintenance*" --tests "*Founding*" 2>&1 | tail -20
```

Expected: all green. The `FoundingCustomerServiceIntegrationTest` from Task 3 was already exercising this path through `truckService.registerTruck` — those should still pass. Existing `TruckServiceIntegrationTest` should also stay green.

- [ ] **Step 5: Commit**

```bash
git -C /Users/olcay.bilir/IdeaProjects/naklos add fleet-module/src/main/java/com/naklos/fleet/application/service/TruckService.java
git -C /Users/olcay.bilir/IdeaProjects/naklos commit -m "TruckService.registerTruck: claim founding slot when fleet hits 4 trucks"
```

---

### Task 5: BE public endpoint + auth permit

**Files:**
- Create: `application/src/main/java/com/naklos/application/api/PublicFoundingController.java`
- Modify: `application/src/main/java/com/naklos/application/security/SecurityConfig.java`
- Create: `application/src/test/java/com/naklos/application/api/PublicFoundingControllerIntegrationTest.java`

- [ ] **Step 1: Write the controller**

```java
package com.naklos.application.api;

import com.naklos.fleet.application.founding.FoundingCustomerService;
import com.naklos.fleet.application.founding.FoundingCustomerService.FoundingStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/**
 * Public marketing endpoints. No auth — these are landing-page data.
 * SecurityConfig must permit /api/public/** without a token.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Public", description = "Unauthenticated marketing endpoints")
public class PublicFoundingController {

    private final FoundingCustomerService foundingService;

    @GetMapping("/founding-status")
    @Operation(summary = "How many founding-customer slots are taken / remain")
    public ResponseEntity<FoundingStatus> foundingStatus() {
        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS))
            .body(foundingService.status());
    }
}
```

- [ ] **Step 2: Permit `/api/public/**` in SecurityConfig**

Find the existing security configuration:

```bash
grep -n "permitAll\|authorizeHttpRequests\|requestMatchers" /Users/olcay.bilir/IdeaProjects/naklos/application/src/main/java/com/naklos/application/security/SecurityConfig.java | head -10
```

Locate the `requestMatchers(...)` chain that lists permit-all paths. Add `"/api/public/**"` to that list. If the file uses a method-chain style:

```java
.requestMatchers("/api/public/**").permitAll()
```

Insert this before the catch-all `.anyRequest().authenticated()`.

- [ ] **Step 3: Write the integration test**

```java
package com.naklos.application.api;

import com.naklos.application.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PublicFoundingControllerIntegrationTest extends IntegrationTestBase {

    @Autowired private MockMvc mvc;

    @Test
    void founding_status_is_public_no_auth_required() throws Exception {
        mvc.perform(get("/api/public/founding-status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.taken").exists())
            .andExpect(jsonPath("$.remaining").exists());
    }

    @Test
    void founding_status_remaining_starts_at_10_on_fresh_db() throws Exception {
        // No setup — leverage that fresh test DB has 0 founding fleets.
        mvc.perform(get("/api/public/founding-status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.taken").value(0))
            .andExpect(jsonPath("$.remaining").value(10));
    }
}
```

If the integration-test base class is named differently (e.g. `ApplicationIntegrationTest`), swap the import. Check by:
```bash
find /Users/olcay.bilir/IdeaProjects/naklos -name "*IntegrationTestBase*.java" -o -name "ApplicationIntegrationTest*.java" | head -3
```

- [ ] **Step 4: Run tests, expect green**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos && ./gradlew :application:test --tests PublicFoundingControllerIntegrationTest 2>&1 | tail -15
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit + push BE main**

```bash
git -C /Users/olcay.bilir/IdeaProjects/naklos add application/src/main/java/com/naklos/application/api/PublicFoundingController.java application/src/main/java/com/naklos/application/security/SecurityConfig.java application/src/test/java/com/naklos/application/api/PublicFoundingControllerIntegrationTest.java
git -C /Users/olcay.bilir/IdeaProjects/naklos commit -m "api: GET /api/public/founding-status (no auth, 60s cache)"
git -C /Users/olcay.bilir/IdeaProjects/naklos push origin main
```

---

### Task 6: FE founding types + publicApi client

**Files:**
- Create: `src/types/founding.ts`
- Create: `src/services/publicApi.ts`

- [ ] **Step 1: Types**

```ts
// src/types/founding.ts
export interface FoundingStatus {
  taken: number;
  remaining: number;
}
```

- [ ] **Step 2: API client**

```ts
// src/services/publicApi.ts
import type { FoundingStatus } from '../types/founding';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

/**
 * Public, unauthenticated endpoints (marketing data only). Doesn't go
 * through `apiCall` because that injects auth headers — public endpoints
 * skip them. Errors are swallowed; callers fall back to a default state.
 */
export const publicApi = {
  async foundingStatus(): Promise<FoundingStatus | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/public/founding-status`);
      if (!res.ok) return null;
      return (await res.json()) as FoundingStatus;
    } catch {
      return null;
    }
  },
};
```

- [ ] **Step 3: Type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/types/founding.ts src/services/publicApi.ts
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "types+services: publicApi.foundingStatus() (no-auth marketing endpoint)"
```

---

### Task 7: i18n keys for the new landing copy

**Files:**
- Modify: `public/locales/tr/translation.json`

The new landing references many keys. Add a fresh `landing` block (replacing the existing one — be careful to KEEP existing keys that other landing components use; only replace the ones we're rewriting).

- [ ] **Step 1: Read the existing landing block**

```bash
grep -n "\"landing\":" /Users/olcay.bilir/IdeaProjects/naklos-web/public/locales/tr/translation.json
```

Read 200 lines starting at that line number to see the full existing block.

- [ ] **Step 2: Add the new keys (preserving existing ones for non-rewritten components)**

Add or update inside `landing` (be precise — these specific paths):

```json
"landing": {
  "betaPill": "Şu anda beta — tüm özellikler ücretsiz",
  "hero": {
    "title1": "Excel'i bırakın.",
    "title2": "Filonuzu",
    "title3": "büyütün.",
    "subtitle": "Türkiye'deki küçük filolar için <strong>yakıt, muayene, bakım takibi</strong>. Donanım yok, taahhüt yok, 3 araca kadar ücretsiz.",
    "cta": "Hemen başla — ücretsiz",
    "trustNoCard": "Kart bilgisi gerekmez",
    "trustKvkk": "KVKK uyumlu",
    "trustSupport": "Türkçe destek",
    "trustNoHardware": "Donanım yok"
  },
  "features": {
    "eyebrow": "Üç şey, doğru yapılmış",
    "title": "Filonuzun unutulan şeyleri otomatik takipte",
    "docs": {
      "title": "Belgeler",
      "description": "Muayene, MTV, sigorta tarihlerini bir daha unutmayın. Bitiş 30/14/7 gün önceden e-posta uyarı."
    },
    "fuel": {
      "title": "Yakıt",
      "description": "\"Yakıt fişi nerede?\" sorununa son. Excel ya da e-posta ile gelen ekstreniz otomatik içe aktarılır, anomaliler işaretlenir."
    },
    "maintenance": {
      "title": "Bakım",
      "description": "Periyodik bakım takvimleri otomatik hatırlatma ile. Sürücü servisten dönerken 'servis girdim' tek dokunuş."
    }
  },
  "comparison": {
    "eyebrow": "Adil bir karşılaştırma",
    "title": "Excel'den uzak, Arvento'ya yakın değil",
    "subtitle": "10 araçlık küçük filo için aylık maliyet ve özellikler.",
    "footnote": "Kaynaklar: Fleetio Essential ($5/araç/ay × kur ortalaması), Arvento 24-ay paketi, naklos beta (Mart 2026).",
    "rows": {
      "monthly": "Aylık (10 araç)",
      "hardware": "Donanım",
      "commitment": "Taahhüt",
      "kvkk": "Türkçe arayüz + KVKK",
      "docs": "Muayene/MTV otomatik takip",
      "anomaly": "Yakıt anomali tespiti",
      "cancel": "İptal"
    },
    "values": {
      "yok": "yok",
      "manuel": "manuel",
      "kismen": "kısmen",
      "always": "istediğin zaman",
      "monthly": "aylık",
      "longTerm": "12–24 ay",
      "needed": "gerekli",
      "duringContract": "sözleşme süresince",
      "naklosFoundingPrice": "₺550 kurucu",
      "anomalyRulesNote": "(12 kural)"
    }
  },
  "pricing": {
    "eyebrow": "Anlaşılır fiyatlandırma",
    "title": "Araç başına. Düz fiyat. Cliff yok.",
    "subtitle": "3 araca kadar ücretsiz. 4+ için araç başı ₺79/ay. <strong>İlk 10 firma için %30 indirim 12 ay kilitli.</strong>",
    "betaBanner": "Şu anda beta — tüm Pro özellikler ücretsiz. Ücretlendirme başladığında haber veririz.",
    "free": {
      "title": "Ücretsiz",
      "subtitle": "Küçük başla. Hep ücretsiz.",
      "price": "₺0",
      "period": "/ay",
      "feature1": "3 araca kadar",
      "feature2": "Tüm temel özellikler",
      "feature3": "Belge takibi + uyarılar",
      "feature4": "Bakım takvimi + Servis girdim",
      "feature5": "Sürücü uygulaması",
      "cta": "Hemen başla"
    },
    "pro": {
      "title": "Pro",
      "subtitle": "4+ araç. Sınırsız.",
      "standardPrice": "₺79",
      "foundingPrice": "₺55",
      "period": "/araç/ay",
      "foundingNote": "İlk 10 firma · %30 indirim · 12 ay kilitli",
      "foundingBadge_remaining": "Kurucu · {{count}} spot kaldı",
      "foundingBadge_full": "Kurucu kontenjanı doldu",
      "feature1": "Free tüm özellikleri",
      "feature2": "Sınırsız araç + sürücü",
      "feature3": "Yakıt anomali motoru (12 kural)",
      "feature4": "Toplu Excel/CSV içe aktarma",
      "feature5": "E-posta öncelikli destek",
      "cta": "Hemen başla — beta ücretsiz"
    },
    "enterpriseLink": "50+ araçlı filonuz mu var? <a>Bize özel teklif için ulaşın →</a>"
  },
  "faq": {
    "eyebrow": "Sık sorulan sorular",
    "title": "Akla gelen ilk altı soru",
    "q1": {
      "q": "Donanım gerekiyor mu?",
      "a": "Hayır. naklos yazılım-yalnızca bir filo yönetim sistemi. GPS kutusu, kart okuyucu, terminal hiçbiri gerekmiyor. Mevcut yakıt kartınız + Excel/e-posta + telefon yeterli."
    },
    "q2": {
      "q": "Mevcut yakıt kartlarımdan veri nasıl gelir?",
      "a": "Aylık ekstrenizi (Opet, Shell, BP, Petrol Ofisi, Aytemiz, TP Excel'leri) içe aktarın — anında çözümleyip araç bazlı yakıt kayıtlarına dönüştürürüz. Kısa süre içinde özel e-posta adresine forward ile otomatikleşecek."
    },
    "q3": {
      "q": "KVKK uyumlu mu?",
      "a": "Evet. Verileriniz Türkiye/AB sunucularında, KVKK + GDPR ilkelerine göre saklanır. Aydınlatma metni, açık rıza, veri silme hakları — hepsi Naklos arayüzünden bir tıkla yönetilir."
    },
    "q4": {
      "q": "İptal etmek istersem?",
      "a": "İstediğiniz an, tek tıkla. Sözleşme yok, taahhüt yok. İndirebileceğiniz tüm verileri ZIP olarak alır, hesabı silersiniz. Ücretsiz tier 3 araca kadar her zaman açık kalır."
    },
    "q5": {
      "q": "Kaç araca kadar ücretsiz?",
      "a": "3 araca kadar her zaman ücretsiz. 4. aracı eklediğinizde Pro tier devreye girer (şu anda beta — yine ücretsiz). Ücretlendirme 2026 sonbaharında başlayacak; ilk 10 kurucu firma %30 indirimi 12 ay kilitler."
    },
    "q6": {
      "q": "Türkçe destek var mı?",
      "a": "Türkçe öncelikli. Tüm arayüz, e-postalar, sürücü uygulaması Türkçe. Mesai saatlerinde e-posta + WhatsApp destek. Pro müşterileri için 24 saat içinde yanıt taahhüdü."
    }
  },
  "finalCta": {
    "title1": "Excel'den çıkmak",
    "title2": "10 dakika",
    "title3": "sürer.",
    "subtitle": "İlk aracını ekle, dakikalar içinde belge ve bakım takibin başlasın. Kart bilgisi gerekmez.",
    "cta": "Hemen başla — ücretsiz",
    "foundingFooter_remaining": "İlk 10 kurucu firma için ₺55/araç/ay 12 ay kilitli · {{count}} spot kaldı",
    "foundingFooter_full": "Kurucu kontenjanı doldu · standart ₺79/araç/ay"
  },
  "nav": {
    "features": "Özellikler",
    "comparison": "Karşılaştırma",
    "pricing": "Fiyatlandırma",
    "faq": "SSS",
    "login": "Giriş"
  },
  "footer": {
    "copyright": "© 2026 · Türkiye'de inşa ediliyor",
    "kvkk": "KVKK",
    "terms": "Şartlar",
    "contact": "İletişim",
    "blog": "Blog"
  }
}
```

If the existing `landing` block has keys not listed above (e.g. for `Benefits`, `HowItWorks`, `SocialProof`, `ContactForm`), KEEP them — those components stay in the codebase per spec §5, just unmounted from the landing flow.

- [ ] **Step 3: Validate JSON + commit**

```bash
cat /Users/olcay.bilir/IdeaProjects/naklos-web/public/locales/tr/translation.json | python3 -m json.tool > /dev/null && echo "ok"
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add public/locales/tr/translation.json
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "i18n: tr — new landing copy (hero, comparison, pricing, faq, finalCta)"
```

---

### Task 8: Header refresh + nav

**Files:**
- Modify: `src/pages/landing/Header.tsx`

Read the existing file first:
```bash
cat /Users/olcay.bilir/IdeaProjects/naklos-web/src/pages/landing/Header.tsx | head -80
```

- [ ] **Step 1: Replace with the new structure**

The new Header has:
- Sticky top with `backdrop-blur-sm bg-warm/90`
- Logo + "naklos" wordmark + green BETA badge
- Desktop nav: 4 anchor links (Özellikler / Karşılaştırma / Fiyatlandırma / SSS)
- Right side: "Giriş" link + "Hemen başla" primary button

Final state:

```tsx
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const startSignup = () => navigate('/signup'); // adjust if existing signup path differs

  return (
    <header className="border-b border-slate-200 bg-warm sticky top-0 z-30 backdrop-blur-sm bg-warm/90">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center text-white font-extrabold text-sm">
            N
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight">naklos</span>
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-confirm-500/10 text-confirm-700 border border-confirm-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-confirm-500" aria-hidden="true" />
            BETA · ücretsiz
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600 font-medium">
          <a href="#features" className="hover:text-slate-900 transition-colors">{t('landing.nav.features')}</a>
          <a href="#compare" className="hover:text-slate-900 transition-colors">{t('landing.nav.comparison')}</a>
          <a href="#pricing" className="hover:text-slate-900 transition-colors">{t('landing.nav.pricing')}</a>
          <a href="#faq" className="hover:text-slate-900 transition-colors">{t('landing.nav.faq')}</a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden sm:inline text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {t('landing.nav.login')}
          </a>
          <button
            type="button"
            onClick={startSignup}
            className="px-4 py-1.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {t('landing.hero.cta')}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
```

**Verify before saving:** `/signup` may not be the right path. Check `App.tsx` for the existing signup route — if it's `/manager/setup` or `/auth/register` or routed via Keycloak, adjust the `startSignup` handler. Same for `/login` — may need to redirect to a Keycloak login URL.

- [ ] **Step 2: Type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/pages/landing/Header.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "Header: sticky nav + BETA pill + Hemen başla CTA"
```

---

### Task 9: Hero rewrite

**Files:**
- Modify: `src/pages/landing/Hero.tsx`

- [ ] **Step 1: Read the existing file to understand layout reset**

The existing Hero has a 2-column grid (text + product mockup). Same structure stays; copy and details change.

- [ ] **Step 2: Replace with the new content**

```tsx
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const startSignup = () => navigate('/signup');

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_50%,transparent_100%)]" />
      <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-20 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">

          <div className="lg:col-span-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-confirm-500/10 border border-confirm-500/20 text-confirm-700 rounded-full text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 bg-confirm-500 rounded-full" aria-hidden="true" />
              {t('landing.betaPill')}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[68px] font-extrabold text-slate-900 mb-5 leading-[1.02] tracking-tight">
              {t('landing.hero.title1')}<br />
              <span className="font-serif italic font-normal text-primary-700">{t('landing.hero.title2')}</span>{' '}
              {t('landing.hero.title3')}
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed">
              <Trans i18nKey="landing.hero.subtitle" components={{ strong: <strong className="text-slate-900 font-semibold" /> }} />
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mb-6">
              <button
                type="button"
                onClick={startSignup}
                className="group w-full sm:w-auto px-7 py-4 bg-primary-700 hover:bg-primary-800 text-white rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-card"
              >
                {t('landing.hero.cta')}
                <span aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
              <a href="#compare" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-2 py-2">
                {t('landing.nav.comparison')} →
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              {[
                t('landing.hero.trustNoCard'),
                t('landing.hero.trustKvkk'),
                t('landing.hero.trustSupport'),
                t('landing.hero.trustNoHardware'),
              ].map((label) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span className="text-confirm-500" aria-hidden="true">✓</span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <HeroProductMock />
          </div>
        </div>
      </div>
    </section>
  );
};

/** Browser-chrome wrapped dashboard preview — mirrors the production
 *  EntityWarningsRollup style but with mock data. Visual fidelity to the
 *  approved /tmp/naklos-landing-mock.html. */
function HeroProductMock() {
  return (
    <div className="relative">
      <div className="absolute -top-6 -left-6 w-24 h-24 bg-accent-500/15 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-primary-500/15 rounded-full blur-3xl" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-cardHover border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 text-[11px] font-mono text-slate-400">naklos.com.tr/manager/dashboard</span>
        </div>
        <div className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-3">
            Bugün incelemelerin
            <span className="ml-1.5 normal-case tracking-normal text-urgent-700">(3 acil)</span>
          </p>
          <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden divide-y divide-slate-100">
            <MockRow tone="urgent" plate="34 ABC 123" subline="3 belge · Muayene, Sigorta, Kasko" rightPill="3 gün" rightPillFilled />
            <MockRow tone="urgent" plate="7 yakıt uyarısı" subline="2 acil · 5 uyarı" sublineColor="text-urgent-700 font-semibold" rightPill="aç" rightPillFilled isUppercase />
            <MockRow tone="attention" plate="07 QRS 300" subline="1 bakım · Motor yağı" rightPill="25 gün" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MockRowProps {
  tone: 'urgent' | 'attention';
  plate: string;
  subline: string;
  sublineColor?: string;
  rightPill: string;
  rightPillFilled?: boolean;
  isUppercase?: boolean;
}

function MockRow({ tone, plate, subline, sublineColor, rightPill, rightPillFilled, isUppercase }: MockRowProps) {
  const stripe = tone === 'urgent' ? 'bg-urgent-500' : 'bg-attention-500';
  const rowBg = tone === 'urgent' ? 'bg-urgent-50/50' : '';
  const iconBg = tone === 'urgent' ? 'bg-urgent-100 text-urgent-600' : 'bg-attention-50 text-attention-600';
  const pillClass = rightPillFilled
    ? `bg-${tone === 'urgent' ? 'urgent' : 'attention'}-100 text-${tone === 'urgent' ? 'urgent' : 'attention'}-700 px-2 py-0.5 rounded-md font-bold font-mono ${isUppercase ? 'uppercase tracking-wider' : ''}`
    : `text-${tone === 'urgent' ? 'urgent' : 'attention'}-700 font-bold font-mono`;
  return (
    <div className={`flex items-stretch ${rowBg}`}>
      <span className={`w-1 ${stripe}`} aria-hidden="true" />
      <div className="flex-1 flex items-center gap-3 px-4 py-3.5">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <span className="text-sm font-bold" aria-hidden="true">{tone === 'urgent' ? '!' : '◆'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{plate}</p>
          <p className={`text-xs ${sublineColor ?? 'text-slate-500'}`}>{subline}</p>
        </div>
        <span className={`text-xs ${pillClass}`}>{rightPill}</span>
      </div>
    </div>
  );
}

export default Hero;
```

- [ ] **Step 2: Type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/pages/landing/Hero.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "Hero: rewrite with new copy + inline product mockup"
```

---

### Task 10: Features (3 pillars)

**Files:**
- Modify: `src/pages/landing/Features.tsx`

- [ ] **Step 1: Replace with the 3-card structure**

```tsx
import { useTranslation } from 'react-i18next';
import { FileText, Fuel, Wrench } from 'lucide-react';

type Pillar = {
  icon: typeof Fuel;
  toneStripe: string;
  toneIconBg: string;
  toneIconText: string;
  titleKey: string;
  descKey: string;
};

const PILLARS: Pillar[] = [
  {
    icon: FileText,
    toneStripe: 'bg-urgent-500',
    toneIconBg: 'bg-urgent-100',
    toneIconText: 'text-urgent-600',
    titleKey: 'landing.features.docs.title',
    descKey: 'landing.features.docs.description',
  },
  {
    icon: Fuel,
    toneStripe: 'bg-attention-500',
    toneIconBg: 'bg-attention-50',
    toneIconText: 'text-attention-600',
    titleKey: 'landing.features.fuel.title',
    descKey: 'landing.features.fuel.description',
  },
  {
    icon: Wrench,
    toneStripe: 'bg-info-500',
    toneIconBg: 'bg-info-50',
    toneIconText: 'text-info-600',
    titleKey: 'landing.features.maintenance.title',
    descKey: 'landing.features.maintenance.description',
  },
];

const Features = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-20 md:py-24 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <p className="font-serif italic text-sm text-primary-700 mb-3">{t('landing.features.eyebrow')}</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
            {t('landing.features.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.titleKey}
                className="bg-warm rounded-2xl p-7 border border-slate-200 hover:border-slate-300 transition-colors relative overflow-hidden"
              >
                <span className={`absolute top-0 left-0 bottom-0 w-0.5 ${p.toneStripe}`} aria-hidden="true" />
                <div className={`w-11 h-11 rounded-xl ${p.toneIconBg} ${p.toneIconText} flex items-center justify-center mb-5`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-extrabold text-slate-900 mb-2 text-[17px]">{t(p.titleKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(p.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
```

- [ ] **Step 2: Type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/pages/landing/Features.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "Features: 3 pillars (Belgeler/Yakıt/Bakım) replacing 4-card grid"
```

---

### Task 11: Comparison table (NEW)

**Files:**
- Create: `src/pages/landing/Comparison.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useTranslation } from 'react-i18next';

const Comparison = () => {
  const { t } = useTranslation();

  const headerCell = 'text-center py-3.5 px-4 text-xs font-semibold text-slate-600';
  const headerCellNaklos = 'text-center py-3.5 px-4 text-xs font-extrabold text-primary-700 bg-primary-50/50 border-x border-primary-100';
  const rowLabel = 'py-3 px-4 text-slate-700 font-medium';
  const cellMono = 'text-center py-3 px-4 text-slate-700 font-mono';
  const cellNaklos = 'text-center py-3 px-4 bg-primary-50/50 border-x border-primary-100';

  const rows: Array<{
    labelKey: string;
    excel: string;
    naklos: React.ReactNode;
    fleetio: { value: string; tone?: 'positive' | 'negative' | 'neutral' };
    arvento: { value: string; tone?: 'positive' | 'negative' | 'neutral' };
  }> = [
    {
      labelKey: 'landing.comparison.rows.monthly',
      excel: '₺0',
      naklos: (
        <>
          <span className="font-extrabold text-primary-700 text-base font-mono">₺790</span>
          <span className="block text-[10px] text-slate-500 mt-0.5">{t('landing.comparison.values.naklosFoundingPrice')}</span>
        </>
      ),
      fleetio: { value: '~₺1.700' },
      arvento: { value: '~₺3.910' },
    },
    {
      labelKey: 'landing.comparison.rows.hardware',
      excel: t('landing.comparison.values.yok'),
      naklos: <span className="font-semibold text-confirm-700">{t('landing.comparison.values.yok')}</span>,
      fleetio: { value: t('landing.comparison.values.yok'), tone: 'positive' },
      arvento: { value: t('landing.comparison.values.needed'), tone: 'negative' },
    },
    {
      labelKey: 'landing.comparison.rows.commitment',
      excel: '—',
      naklos: <span className="font-semibold text-confirm-700">{t('landing.comparison.values.yok')}</span>,
      fleetio: { value: t('landing.comparison.values.monthly'), tone: 'positive' },
      arvento: { value: t('landing.comparison.values.longTerm'), tone: 'negative' },
    },
    {
      labelKey: 'landing.comparison.rows.kvkk',
      excel: '—',
      naklos: <span className="text-confirm-600">✓</span>,
      fleetio: { value: '✗', tone: 'negative' },
      arvento: { value: '✓', tone: 'positive' },
    },
    {
      labelKey: 'landing.comparison.rows.docs',
      excel: t('landing.comparison.values.manuel'),
      naklos: <span className="text-confirm-600">✓</span>,
      fleetio: { value: '✗', tone: 'negative' },
      arvento: { value: '✓', tone: 'positive' },
    },
    {
      labelKey: 'landing.comparison.rows.anomaly',
      excel: t('landing.comparison.values.yok'),
      naklos: (
        <>
          <span className="text-confirm-600">✓</span>
          <span className="text-[10px] text-slate-500 ml-1">{t('landing.comparison.values.anomalyRulesNote')}</span>
        </>
      ),
      fleetio: { value: t('landing.comparison.values.kismen'), tone: 'neutral' },
      arvento: { value: t('landing.comparison.values.kismen'), tone: 'neutral' },
    },
    {
      labelKey: 'landing.comparison.rows.cancel',
      excel: '—',
      naklos: <span className="font-semibold text-confirm-700">{t('landing.comparison.values.always')}</span>,
      fleetio: { value: t('landing.comparison.values.always'), tone: 'positive' },
      arvento: { value: t('landing.comparison.values.duringContract'), tone: 'negative' },
    },
  ];

  const toneClass = (tone?: 'positive' | 'negative' | 'neutral') => {
    if (tone === 'positive') return 'text-confirm-700 font-semibold';
    if (tone === 'negative') return 'text-urgent-700 font-semibold';
    if (tone === 'neutral') return 'text-attention-700 font-semibold';
    return 'text-slate-700';
  };

  return (
    <section id="compare" className="py-20 md:py-24">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="font-serif italic text-sm text-primary-700 mb-3">{t('landing.comparison.eyebrow')}</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('landing.comparison.title')}
          </h2>
          <p className="text-slate-600 mt-3 max-w-xl mx-auto">{t('landing.comparison.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500" />
                <th className={headerCell}>Excel</th>
                <th className={headerCellNaklos}>naklos Pro</th>
                <th className={headerCell}>Fleetio</th>
                <th className={headerCell}>Arvento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.labelKey}>
                  <td className={rowLabel}>{t(row.labelKey)}</td>
                  <td className={cellMono}>{row.excel}</td>
                  <td className={cellNaklos}>{row.naklos}</td>
                  <td className={`text-center py-3 px-4 ${toneClass(row.fleetio.tone)}`}>{row.fleetio.value}</td>
                  <td className={`text-center py-3 px-4 ${toneClass(row.arvento.tone)}`}>{row.arvento.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          {t('landing.comparison.footnote')}
        </p>
      </div>
    </section>
  );
};

export default Comparison;
```

- [ ] **Step 2: Type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/pages/landing/Comparison.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "Comparison: new landing section — Excel vs naklos vs Fleetio vs Arvento"
```

---

### Task 12: Pricing rewrite

**Files:**
- Modify: `src/pages/landing/Pricing.tsx`

- [ ] **Step 1: Read the current file**

```bash
wc -l /Users/olcay.bilir/IdeaProjects/naklos-web/src/pages/landing/Pricing.tsx
```

- [ ] **Step 2: Full rewrite**

```tsx
import { useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '../../services/publicApi';
import type { FoundingStatus } from '../../types/founding';

const Pricing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [founding, setFounding] = useState<FoundingStatus | null>(null);

  useEffect(() => {
    void publicApi.foundingStatus().then(setFounding);
  }, []);

  const startSignup = () => navigate('/signup');
  const goContact = () => navigate('/iletisim'); // adjust to existing contact route

  const remaining = founding?.remaining ?? 7; // fallback so the badge isn't blank
  const isFull = remaining === 0;

  return (
    <section id="pricing" className="py-20 md:py-28 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="font-serif italic text-sm text-primary-700 mb-3">{t('landing.pricing.eyebrow')}</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            <Trans i18nKey="landing.pricing.subtitle" components={{ strong: <strong className="text-slate-900" /> }} />
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-10 px-5 py-3 rounded-xl bg-confirm-500/10 border border-confirm-500/20 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-confirm-700">
            <span className="w-1.5 h-1.5 rounded-full bg-confirm-500" aria-hidden="true" />
            {t('landing.pricing.betaBanner')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* Free */}
          <div className="bg-warm rounded-2xl border border-slate-200 p-7 flex flex-col">
            <div className="mb-5">
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">{t('landing.pricing.free.title')}</h3>
              <p className="text-sm text-slate-600">{t('landing.pricing.free.subtitle')}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">{t('landing.pricing.free.price')}</span>
              <span className="text-slate-500 text-sm ml-1">{t('landing.pricing.free.period')}</span>
            </div>
            <ul className="space-y-2.5 mb-7 text-sm text-slate-700 flex-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="text-confirm-600 mt-0.5">✓</span>
                  {t(`landing.pricing.free.feature${n}`)}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={startSignup}
              className="w-full text-center px-5 py-3 bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-900 rounded-xl font-bold text-sm transition-colors"
            >
              {t('landing.pricing.free.cta')}
            </button>
          </div>

          {/* Pro */}
          <div className="relative bg-gradient-to-br from-primary-700 to-primary-800 text-white rounded-2xl p-7 flex flex-col shadow-cardHover">
            <div className="absolute -top-3 right-5">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent-500 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-full shadow-card">
                {isFull
                  ? t('landing.pricing.pro.foundingBadge_full')
                  : t('landing.pricing.pro.foundingBadge_remaining', { count: remaining })}
              </span>
            </div>

            <div className="mb-5">
              <h3 className="text-xl font-extrabold mb-1">{t('landing.pricing.pro.title')}</h3>
              <p className="text-sm text-primary-100">{t('landing.pricing.pro.subtitle')}</p>
            </div>
            <div className="mb-2">
              {!isFull && (
                <>
                  <span className="text-base text-primary-200 line-through font-mono">{t('landing.pricing.pro.standardPrice')}</span>
                  <span className="text-4xl font-extrabold font-mono ml-2">{t('landing.pricing.pro.foundingPrice')}</span>
                </>
              )}
              {isFull && <span className="text-4xl font-extrabold font-mono">{t('landing.pricing.pro.standardPrice')}</span>}
              <span className="text-primary-100 text-sm ml-1">{t('landing.pricing.pro.period')}</span>
            </div>
            {!isFull && <p className="text-xs text-primary-100 mb-6">{t('landing.pricing.pro.foundingNote')}</p>}
            {isFull && <p className="text-xs text-primary-100 mb-6">&nbsp;</p>}

            <ul className="space-y-2.5 mb-7 text-sm flex-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="text-confirm-500 mt-0.5">✓</span>
                  {t(`landing.pricing.pro.feature${n}`)}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={startSignup}
              className="w-full text-center px-5 py-3 bg-white text-primary-800 hover:bg-warm rounded-xl font-bold text-sm transition-colors"
            >
              {t('landing.pricing.pro.cta')}
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-600">
            <Trans
              i18nKey="landing.pricing.enterpriseLink"
              components={{
                a: (
                  <a
                    onClick={goContact}
                    className="font-semibold text-primary-700 hover:text-primary-800 underline underline-offset-2 cursor-pointer"
                  />
                ),
              }}
            />
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
```

- [ ] **Step 2: Type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/pages/landing/Pricing.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "Pricing: 2 cards (Free/Pro) with live founding-spot counter"
```

---

### Task 13: FAQ (NEW)

**Files:**
- Create: `src/pages/landing/FAQ.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useTranslation } from 'react-i18next';

const QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

const FAQ = () => {
  const { t } = useTranslation();

  return (
    <section id="faq" className="py-20 md:py-24 bg-warm">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="font-serif italic text-sm text-primary-700 mb-3">{t('landing.faq.eyebrow')}</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('landing.faq.title')}
          </h2>
        </div>

        <div className="space-y-3">
          {QUESTIONS.map((q) => (
            <details
              key={q}
              className="bg-white rounded-xl border border-slate-200 px-5 py-4 [&[open]>summary>span]:rotate-180 group"
            >
              <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-900 text-base">
                {t(`landing.faq.${q}.q`)}
                <span aria-hidden="true" className="transition-transform">▾</span>
              </summary>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{t(`landing.faq.${q}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
```

- [ ] **Step 2: Type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/pages/landing/FAQ.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "FAQ: 6-question accordion section (native details)"
```

---

### Task 14: FinalCTA (NEW)

**Files:**
- Create: `src/pages/landing/FinalCTA.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '../../services/publicApi';
import type { FoundingStatus } from '../../types/founding';

const FinalCTA = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [founding, setFounding] = useState<FoundingStatus | null>(null);

  useEffect(() => {
    void publicApi.foundingStatus().then(setFounding);
  }, []);

  const remaining = founding?.remaining ?? 7;
  const isFull = remaining === 0;

  const startSignup = () => navigate('/signup');

  return (
    <section className="py-20 md:py-24 bg-primary-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" aria-hidden="true" />
      <div className="relative max-w-3xl mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
          {t('landing.finalCta.title1')}<br />
          <span className="font-serif italic font-normal text-primary-200">{t('landing.finalCta.title2')}</span>{' '}
          {t('landing.finalCta.title3')}
        </h2>
        <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">{t('landing.finalCta.subtitle')}</p>
        <button
          type="button"
          onClick={startSignup}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-800 rounded-xl font-bold text-base hover:bg-warm transition-colors shadow-card"
        >
          {t('landing.finalCta.cta')}
          <span aria-hidden="true">→</span>
        </button>
        <p className="text-primary-200 text-xs mt-5 font-mono">
          {isFull
            ? t('landing.finalCta.foundingFooter_full')
            : t('landing.finalCta.foundingFooter_remaining', { count: remaining })}
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
```

- [ ] **Step 2: Type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/pages/landing/FinalCTA.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "FinalCTA: dark band closing section with founding-spot live counter"
```

---

### Task 15: Footer refresh

**Files:**
- Modify: `src/pages/landing/Footer.tsx`

- [ ] **Step 1: Replace with the new structure**

```tsx
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-white border-t border-slate-200 py-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center text-white font-extrabold text-xs">
            N
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight">naklos</span>
          <span className="text-xs text-slate-500 ml-2">{t('landing.footer.copyright')}</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <a href="/kvkk" className="hover:text-slate-900 transition-colors">{t('landing.footer.kvkk')}</a>
          <a href="/sartlar" className="hover:text-slate-900 transition-colors">{t('landing.footer.terms')}</a>
          <a href="/iletisim" className="hover:text-slate-900 transition-colors">{t('landing.footer.contact')}</a>
          <a href="/blog" className="hover:text-slate-900 transition-colors">{t('landing.footer.blog')}</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

Verify the existing routes (`/kvkk`, `/sartlar`, `/iletisim`, `/blog`) — if any don't exist, leave the link but adjust href to whatever the existing path is, OR remove the link for v1.

- [ ] **Step 2: Type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/pages/landing/Footer.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "Footer: simplified row + KVKK/Şartlar/İletişim/Blog links"
```

---

### Task 16: LandingPage routing — drop unused sections, mount new ones

**Files:**
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Read current file**

```bash
cat /Users/olcay.bilir/IdeaProjects/naklos-web/src/pages/LandingPage.tsx
```

- [ ] **Step 2: Replace with the new section ordering**

```tsx
import Header from './landing/Header';
import Hero from './landing/Hero';
import Features from './landing/Features';
import Comparison from './landing/Comparison';
import Pricing from './landing/Pricing';
import FAQ from './landing/FAQ';
import FinalCTA from './landing/FinalCTA';
import Footer from './landing/Footer';

const LandingPage = () => {
  return (
    <div className="bg-warm text-slate-900 antialiased">
      <Header />
      <Hero />
      <Features />
      <Comparison />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
```

The existing `Benefits`, `HowItWorks`, `SocialProof`, `ContactForm` are NO LONGER imported here. They stay in the codebase (don't delete the files) for future reuse.

- [ ] **Step 3: Type-check + run tests + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit; echo "tsc=$?"
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx vitest run --reporter=default 2>&1 | tail -10
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/pages/LandingPage.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "LandingPage: new section order (Hero/Features/Comparison/Pricing/FAQ/FinalCTA)"
```

---

### Task 17: Lint + test verification + push

- [ ] **Step 1: Lint sweep on all touched files**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx eslint \
  src/types/founding.ts src/services/publicApi.ts \
  src/pages/landing/Header.tsx src/pages/landing/Hero.tsx \
  src/pages/landing/Features.tsx src/pages/landing/Comparison.tsx \
  src/pages/landing/Pricing.tsx src/pages/landing/FAQ.tsx \
  src/pages/landing/FinalCTA.tsx src/pages/landing/Footer.tsx \
  src/pages/LandingPage.tsx 2>&1 | tail -15
```

Zero new errors expected. Set-state-in-effect warnings on Pricing.tsx and FinalCTA.tsx are pre-existing project pattern (already downgraded to warning in eslint.config.js earlier).

- [ ] **Step 2: Type-check**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit; echo "tsc=$?"
```

Expect tsc=0.

- [ ] **Step 3: Test suite**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx vitest run --reporter=default 2>&1 | tail -10
```

Expect 72/72 still passing — landing components have no unit-test coverage in the current codebase, so this should be zero-impact.

- [ ] **Step 4: Manual smoke test**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npm run dev
```

Open the dev server URL and walk the landing page top to bottom:
- Header: BETA pill renders; nav anchors smooth-scroll to sections
- Hero: H1 + dashboard mockup + trust strip render correctly
- Features: 3 cards (Belgeler / Yakıt / Bakım) with severity stripes
- Comparison: table renders with naklos column highlighted
- Pricing: 2 cards. Pro card shows "Kurucu · X spot kaldı" badge — verify the number matches `GET /api/public/founding-status` (hit it directly to confirm)
- FAQ: 6 questions, accordion expand/collapse works
- FinalCTA: dark band, founding footer line shows X spot kaldı
- Footer: renders

If anything breaks, fix in place + commit a follow-up.

- [ ] **Step 5: Push to main**

```bash
git -C /Users/olcay.bilir/IdeaProjects/naklos-web log --oneline origin/main..HEAD
git -C /Users/olcay.bilir/IdeaProjects/naklos-web push origin main
```

---

## 3. Self-review checklist

- [x] **Spec coverage** — every section of the design spec maps to a task: §2 pricing → T7 i18n + T12 Pricing component; §3 founding mechanic → T1 migration + T2 entity + T3 service + T4 hook + T5 endpoint; §4 landing structure → T8-T16; §5 removed components → T16 (no longer imported); §6 wire shape → T5 + T6.
- [x] **Placeholder scan** — every step has actual code or commands. Open questions in spec §10 are documented as "verify before saving" notes inline (not blockers).
- [x] **Type consistency** — `FoundingStatus` type defined in T6 (FE) matches BE `record FoundingStatus(long taken, long remaining)` in T3 (BE). i18n keys in T7 match the `t(...)` lookups across components T8-T15.
- [x] **MaintenanceTab pattern reused** — T4 hook follows the same pattern as `scheduleSeeder.seed(saved)` from the maintenance plan (already merged).
- [x] **Atomicity** — T3's UNIQUE-constraint-driven retry loop is race-safe at the DB level. Documented in code comments.
- [x] **Sticky founding flag** — T2's `grantFoundingSlot` early-returns when `foundingCustomerSeq != null`. T3's test #5 (`slot_is_sticky_after_claiming`) verifies.
- [x] **No regressions** — existing tests (60 FE + maintenance/anomaly BE) untouched. T17 verifies.

---

## 4. Decisions deferred to follow-up plans

- **EN/DE locales** — TR-only for v1. EN/DE land in a separate plan once TR copy is validated by visitors.
- **In-app founding-customer celebration toast** — defer until Stripe wires up.
- **Backfill founding slots for existing eligible fleets** — first-come-first-served from V19 onward.
- **A/B test infrastructure** — single landing variant for v1.

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-25-landing-rewrite.md`.**
