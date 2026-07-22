const getStorageKey = (profileId: string) => `kids_learnquest_progress_${profileId}`;

export const getLocalCompletedUnits = (profileId: string): string[] => {
  try {
    const data = localStorage.getItem(getStorageKey(profileId));
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const markUnitCompleted = (profileId: string, unitCode: string): void => {
  if (!profileId || !unitCode) return;
  const current = getLocalCompletedUnits(profileId);
  if (!current.includes(unitCode)) {
    const updated = [...current, unitCode];
    localStorage.setItem(getStorageKey(profileId), JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, unitCode })
      }).catch(() => {});
    }
  }
};

export const fetchCompletedUnits = async (profileId: string): Promise<string[]> => {
  try {
    if (typeof window === 'undefined') return getLocalCompletedUnits(profileId);
    const res = await fetch(`/api/progress/${profileId}`);
    if (!res.ok) return getLocalCompletedUnits(profileId);
    const data = await res.json();
    const serverUnits: string[] = data.completedUnits || [];
    localStorage.setItem(getStorageKey(profileId), JSON.stringify(serverUnits));
    return serverUnits;
  } catch {
    return getLocalCompletedUnits(profileId);
  }
};

