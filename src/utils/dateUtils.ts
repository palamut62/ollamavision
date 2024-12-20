export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 24 saatten az
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // 7 günden az
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'short' 
    });
  }
  
  // Diğer durumlar
  return date.toLocaleDateString('tr-TR', { 
    day: '2-digit',
    month: 'short'
  });
} 