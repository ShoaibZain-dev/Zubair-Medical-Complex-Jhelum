const fs = require('fs');
const file = 'C:/Users/Infinity Touch Store/Desktop/zubairmedicalcompexjhelum/src/lib/storage.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `  hasNotificationBeenSent(
    appointmentId: string,
    event: string,
    channel: string,
    recipientType: string
  ): boolean {
    const data = ensureDataFile();
    return data.notificationLogs.some(
      l =>
        l.appointment_id === appointmentId &&
        l.event === event &&
        l.channel === channel &&
        l.recipient_type === recipientType &&
        (l.status === 'sent' || l.status === 'delivered' || l.status === 'simulated')
    );
  },`;

const replacement = `  hasNotificationBeenSent(
    appointmentId: string,
    event: string,
    channel: string,
    recipientType: string
  ): boolean {
    const data = ensureDataFile();
    return data.notificationLogs.some(
      l =>
        l.appointment_id === appointmentId &&
        l.event === event &&
        l.recipient_type === recipientType &&
        (l.status === 'sent' || l.status === 'delivered' || l.status === 'simulated') &&
        (channel === 'messaging' || channel === 'whatsapp'
          ? (l.channel === 'whatsapp' || l.channel === 'sms' || l.channel === 'mock')
          : l.channel === channel)
    );
  },`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Successfully patched storage.ts');
} else {
  console.log('Target block not found in storage.ts');
}