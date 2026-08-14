import { CONSIGNMENT_STATUS_LABELS, CONSIGNMENT_STATUS_WORKFLOW } from '../../constants/consignment';
import type { ConsignmentStatus } from '../../types';

/** Connected route-line progress indicator — shared with the mobile app's visual language. Renders nothing for CANCELLED. */
export function WorkflowStepper({
  currentStatus,
  subdued = false,
}: {
  currentStatus: ConsignmentStatus;
  /** Dims the whole stepper once the consignment reaches a terminal, no-longer-actionable state. */
  subdued?: boolean;
}) {
  const stepIndex = CONSIGNMENT_STATUS_WORKFLOW.indexOf(currentStatus);
  if (stepIndex < 0) return null;

  const lastIndex = CONSIGNMENT_STATUS_WORKFLOW.length - 1;
  const progressPct = lastIndex === 0 ? 0 : (stepIndex / lastIndex) * 100;

  return (
    <div className={subdued ? 'opacity-50' : undefined}>
      <div className="relative flex h-4 items-center">
        <div className="absolute inset-x-2 h-0.5 rounded-full bg-ink-150" />
        <div className="absolute left-2 h-0.5 rounded-full bg-brand" style={{ width: `${progressPct}%` }} />
        <div className="relative flex w-full justify-between">
          {CONSIGNMENT_STATUS_WORKFLOW.map((step, index) => {
            const isCurrent = index === stepIndex;
            const isCompleted = index < stepIndex;
            return (
              <div key={step} className="flex w-4 items-center justify-center">
                {isCurrent ? (
                  <div className="h-3 w-3 rounded-full bg-brand" />
                ) : (
                  <div
                    className={
                      isCompleted
                        ? 'h-2 w-2 rounded-full bg-brand'
                        : 'h-2 w-2 rounded-full border-[1.5px] border-ink-300 bg-surface'
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex">
        {CONSIGNMENT_STATUS_WORKFLOW.map((step, index) => (
          <span
            key={step}
            className={`flex-1 text-center text-[11px] ${
              index === stepIndex
                ? 'font-bold text-brand'
                : index > stepIndex
                  ? 'text-ink-500'
                  : 'text-ink-700'
            }`}
          >
            {CONSIGNMENT_STATUS_LABELS[step]}
          </span>
        ))}
      </div>
    </div>
  );
}
