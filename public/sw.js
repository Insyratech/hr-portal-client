self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload = { title: 'HR Portal', body: 'You have a new notification.', deepLink: '/' };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: '/icon',
    badge: '/icon',
    data: {
      deepLink: payload.deepLink || '/',
      url: payload.deepLink || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const deepLink = event.notification.data?.deepLink || event.notification.data?.url || '/';
  const targetUrl = new URL(deepLink, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
