const getRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diff = Math.max(now - timestamp, 0);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) {
    return `Il y a ${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `Il y a ${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Il y a ${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
};

export default getRelativeTime;
