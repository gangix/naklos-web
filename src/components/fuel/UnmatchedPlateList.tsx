export interface UnmatchedPlateListProps { fleetId: string; batchId: string | null; }
export default function UnmatchedPlateList(_props: UnmatchedPlateListProps) {
  return <p className="text-gray-500">Yükleniyor… (Task 16 dolduracak)</p>;
}
