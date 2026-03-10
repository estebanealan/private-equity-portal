import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layouts/AppShell";
import { requirePageRole } from "@/lib/auth";
import {
  listAdminMovementAssets,
  listAdminMovementClients,
  listAdminMovements,
  registerMovement,
} from "@/server/services/movement.service";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ feedback?: string; reason?: string }>;
};

export default async function AdminPage({ params, searchParams }: AdminPageProps) {
  const { locale } = await params;
  const { feedback, reason } = await searchParams;
  const session = await requirePageRole(locale, ["admin", "super_admin"]);

  let items: Awaited<ReturnType<typeof listAdminMovements>> = [];
  let clientOptions: Awaited<ReturnType<typeof listAdminMovementClients>> = [];
  let assetOptions: Awaited<ReturnType<typeof listAdminMovementAssets>> = [];
  let loadError = false;

  try {
    [items, clientOptions, assetOptions] = await Promise.all([
      listAdminMovements(),
      listAdminMovementClients(),
      listAdminMovementAssets(),
    ]);
  } catch {
    loadError = true;
  }

  const canSaveMovement = !loadError && clientOptions.length > 0 && assetOptions.length > 0;

  async function createMovementAction(formData: FormData) {
    "use server";

    const activeSession = await requirePageRole(locale, ["admin", "super_admin"]);
    const clientProfileId = String(formData.get("clientProfileId") ?? "");
    const assetId = String(formData.get("assetId") ?? "");
    const direction = String(formData.get("direction") ?? "inflow");
    const amountRaw = String(formData.get("amountUsd") ?? "0");
    const effectiveAtRaw = String(formData.get("effectiveAt") ?? "");
    const notesRaw = String(formData.get("notes") ?? "").trim();

    try {
      await registerMovement(
        {
          clientProfileId,
          assetId,
          amountUsd: Number(amountRaw),
          direction,
          effectiveAt: new Date(effectiveAtRaw).toISOString(),
          ...(notesRaw ? { notes: notesRaw } : {}),
        },
        activeSession.userId,
      );

      revalidatePath(`/${locale}/admin`);
      redirect(`/${locale}/admin?feedback=success`);
    } catch {
      redirect(`/${locale}/admin?feedback=error&reason=save_failed`);
    }
  }

  return (
    <AppShell
      eyebrow="Admin workspace"
      locale={locale}
      session={session}
      subtitle="Movement capture, operational controls, and investor-facing visibility now share the same domain foundation."
      title="Financial operations with traceable movement flows."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-50)/0.70)] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-surface-950">Recent movements</h2>
              <p className="mt-2 text-sm leading-6 text-surface-700">
                Source of truth for contributions, distributions, and transfers visible to
                operations.
              </p>
            </div>
            <div className="rounded-full border border-[rgb(var(--color-brand-500)/0.30)] bg-[rgb(var(--color-brand-500)/0.10)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-brand-400">
              {items.length} records
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <article
                className="rounded-3xl border border-white/10 bg-[rgb(var(--color-surface-0)/0.80)] p-5"
                key={item.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-brand-400">
                      {item.clientCode}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-surface-950">
                      {item.assetName}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-[0.18em] text-surface-500">
                      {item.direction}
                    </div>
                    <div className="mt-2 text-lg font-semibold text-surface-950">
                      ${item.amountUsd.toLocaleString("en-US")}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-surface-700">
                  {item.notes ?? "No note attached."}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-surface-500">
                  <span>{new Date(item.effectiveAt).toLocaleDateString("en-US")}</span>
                  <span>{item.recordedByName}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[rgb(var(--color-surface-0)/0.80)] p-6">
          <h2 className="text-xl font-semibold text-surface-950">Register movement</h2>
          <p className="mt-2 text-sm leading-6 text-surface-700">
            This writes directly to PostgreSQL through the service layer.
          </p>

          {feedback === "success" ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Movement saved successfully.
            </div>
          ) : null}

          {feedback === "error" ? (
            <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              Could not save movement{reason === "save_failed" ? " due to a server error." : "."}
            </div>
          ) : null}

          {!canSaveMovement ? (
            <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {loadError
                ? "Database is currently unavailable."
                : "Missing client or asset records in database. Seed required before capturing movements."}
            </div>
          ) : null}

          <form action={createMovementAction} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm text-surface-700">
              Client
              <select
                className="rounded-2xl border border-white/10 bg-surface-50 px-4 py-3 text-surface-950"
                defaultValue={clientOptions[0]?.clientProfileId}
                disabled={!canSaveMovement}
                name="clientProfileId"
              >
                {clientOptions.map((item) => (
                  <option key={item.clientProfileId} value={item.clientProfileId}>
                    {item.clientCode}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-surface-700">
              Asset
              <select
                className="rounded-2xl border border-white/10 bg-surface-50 px-4 py-3 text-surface-950"
                defaultValue={assetOptions[0]?.assetId}
                disabled={!canSaveMovement}
                name="assetId"
              >
                {assetOptions.map((item) => (
                  <option key={item.assetId} value={item.assetId}>
                    {item.assetName}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-surface-700">
              Direction
              <select
                className="rounded-2xl border border-white/10 bg-surface-50 px-4 py-3 text-surface-950"
                defaultValue="inflow"
                disabled={!canSaveMovement}
                name="direction"
              >
                <option value="inflow">Inflow</option>
                <option value="outflow">Outflow</option>
                <option value="transfer">Transfer</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-surface-700">
              Amount (USD)
              <input
                className="rounded-2xl border border-white/10 bg-surface-50 px-4 py-3 text-surface-950"
                disabled={!canSaveMovement}
                min="0.01"
                name="amountUsd"
                step="0.01"
                type="number"
              />
            </label>

            <label className="grid gap-2 text-sm text-surface-700">
              Effective at
              <input
                className="rounded-2xl border border-white/10 bg-surface-50 px-4 py-3 text-surface-950"
                disabled={!canSaveMovement}
                name="effectiveAt"
                type="datetime-local"
              />
            </label>

            <label className="grid gap-2 text-sm text-surface-700">
              Notes
              <textarea
                className="min-h-[88px] rounded-2xl border border-white/10 bg-surface-50 px-4 py-3 text-surface-950"
                disabled={!canSaveMovement}
                name="notes"
              />
            </label>

            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-brand-500 bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSaveMovement}
              type="submit"
            >
              Save movement
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
