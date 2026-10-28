import webpush from "web-push";
import { getDb } from "./db";

type PushSubscription = { endpoint: string; keys_json: string };

export async function sendPush(userId: string, payload: { title: string; body: string; url?: string }) {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  const db = getDb();
  const subscriptions = db.prepare("SELECT endpoint,keys_json FROM push_subscriptions WHERE user_id=?").all(userId) as PushSubscription[];
  await Promise.all(subscriptions.map(async (row) => {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, ...JSON.parse(row.keys_json) },
        JSON.stringify(payload),
      );
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        db.prepare("DELETE FROM push_subscriptions WHERE endpoint=?").run(row.endpoint);
      } else {
        console.error("Web push delivery failed.", error);
      }
    }
  }));
}
