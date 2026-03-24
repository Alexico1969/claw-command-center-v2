import { getUnreadEmailsData, type ProductivityEmail } from "@/lib/server/productivity";

export const dynamic = "force-dynamic";

function formatReceivedAt(receivedAt: string) {
  const date = new Date(receivedAt);
  if (Number.isNaN(date.getTime())) return receivedAt;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EmailRow({ email }: { email: ProductivityEmail }) {
  const content = (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-zinc-100">{email.subject || "(No subject)"}</div>
          <div className="mt-1 text-xs text-zinc-400">{email.from}</div>
        </div>
        <div className="shrink-0 text-xs text-zinc-500">{formatReceivedAt(email.receivedAt)}</div>
      </div>

      {email.snippet ? <div className="mt-3 text-sm text-zinc-300">{email.snippet}</div> : null}

      {email.labels?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {email.labels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] uppercase tracking-wide text-zinc-400"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (!email.htmlLink) return content;

  return (
    <a href={email.htmlLink} rel="noreferrer" target="_blank">
      {content}
    </a>
  );
}

export default async function EmailsPage() {
  const data = await getUnreadEmailsData();
  const unread = data.ok ? data.unread : [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Emails</h1>
          <p className="mt-1 text-sm text-zinc-400">Unread mail synced by the OpenClaw agent</p>
        </div>
        <div className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
          {unread.length} unread
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        {!data.ok ? <div className="text-amber-300">Emails error: {data.error}</div> : null}
        {data.ok && data.note ? <div className="text-zinc-400">{data.note}</div> : null}
        {data.ok && !data.note ? (
          <div className="space-y-3">
            {unread.length ? (
              unread.map((email) => <EmailRow key={email.id} email={email} />)
            ) : (
              <div className="text-zinc-400">No unread emails</div>
            )}
          </div>
        ) : null}
      </div>

      <div className="text-xs text-zinc-500">
        {data.ok && data.syncedAt
          ? `Last synced ${new Date(data.syncedAt * 1000).toLocaleString("en-US")}`
          : "Awaiting the latest unread email snapshot from the agent"}
      </div>
    </div>
  );
}
