// SIGI ERP - Service Worker para Notificações Nativas e Mobile / Lock Screen
const CACHE_NAME = 'sigi-erp-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener para clique na notificação do sistema / ecrã de bloqueio
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const actionUrl = (event.notification.data && event.notification.data.actionUrl) 
    ? event.notification.data.actionUrl 
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver uma janela aberta do SIGI, foca nela e navega se necessário
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          if (actionUrl && actionUrl !== '/' && client.url.indexOf(actionUrl) === -1) {
            client.navigate(actionUrl);
          }
          return client.focus();
        }
      }
      // Se nenhuma janela estiver aberta, abre nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(actionUrl);
      }
    })
  );
});

// Listener para fecho de notificação
self.addEventListener('notificationclose', (event) => {
  // Opcional: telemetria local
});

// Listener para mensagens da aplicação principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
