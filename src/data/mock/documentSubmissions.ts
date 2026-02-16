import type { DocumentSubmission } from '../../types';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);

export const mockDocumentSubmissions: DocumentSubmission[] = [
  // Pending driver license renewal
  {
    id: 'doc-sub-1',
    category: 'license',
    relatedType: 'driver',
    relatedId: 'driver-1',
    relatedName: 'Mehmet Yılmaz',
    submittedBy: 'driver',
    submittedByName: 'Mehmet Yılmaz',
    imageDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RG9jdW1lbnQ8L3RleHQ+PC9zdmc+',
    suggestedExpiryDate: '2029-03-15',
    confirmedExpiryDate: null,
    status: 'pending',
    submittedAt: today.toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    rejectionNote: null,
    previousImageDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjODg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+T2xkIERvYzwvdGV4dD48L3N2Zz4=',
    previousExpiryDate: '2026-03-15',
  },

  // Pending SRC certificate
  {
    id: 'doc-sub-2',
    category: 'src',
    relatedType: 'driver',
    relatedId: 'driver-2',
    relatedName: 'Ali Demir',
    submittedBy: 'driver',
    submittedByName: 'Ali Demir',
    imageDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RG9jdW1lbnQ8L3RleHQ+PC9zdmc+',
    suggestedExpiryDate: '2029-06-20',
    confirmedExpiryDate: null,
    status: 'pending',
    submittedAt: yesterday.toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    rejectionNote: null,
    previousImageDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjODg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+T2xkIERvYzwvdGV4dD48L3N2Zz4=',
    previousExpiryDate: '2026-06-20',
  },

  // Approved truck insurance (manager uploaded directly)
  {
    id: 'doc-sub-3',
    category: 'compulsory-insurance',
    relatedType: 'truck',
    relatedId: 'truck-1',
    relatedName: '34 ABC 123',
    submittedBy: 'manager',
    submittedByName: 'Fleet Manager',
    imageDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RG9jdW1lbnQ8L3RleHQ+PC9zdmc+',
    suggestedExpiryDate: '2027-01-10',
    confirmedExpiryDate: '2027-01-10',
    status: 'approved',
    submittedAt: twoDaysAgo.toISOString(),
    reviewedAt: twoDaysAgo.toISOString(),
    reviewedBy: 'Fleet Manager',
    rejectionReason: null,
    rejectionNote: null,
    previousImageDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjODg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+T2xkIERvYzwvdGV4dD48L3N2Zz4=',
    previousExpiryDate: '2026-01-10',
  },

  // Rejected license (blurry photo)
  {
    id: 'doc-sub-4',
    category: 'license',
    relatedType: 'driver',
    relatedId: 'driver-3',
    relatedName: 'Hasan Kaya',
    submittedBy: 'driver',
    submittedByName: 'Hasan Kaya',
    imageDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RG9jdW1lbnQ8L3RleHQ+PC9zdmc+',
    suggestedExpiryDate: '2029-04-01',
    confirmedExpiryDate: null,
    status: 'rejected',
    submittedAt: twoDaysAgo.toISOString(),
    reviewedAt: yesterday.toISOString(),
    reviewedBy: 'Fleet Manager',
    rejectionReason: 'blurry',
    rejectionNote: 'Lütfen daha net bir fotoğraf çekin',
    previousImageDataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjODg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+T2xkIERvYzwvdGV4dD48L3N2Zz4=',
    previousExpiryDate: '2026-04-01',
  },
];
