export interface DisplayStateResult {
  displayStatus: "UP" | "DEGRADED" | "DOWN" | "UNKNOWN" | "PAUSED";
  label: string;
  isStale: boolean;
  evidence: string;
  dotColor: string;
  badgeClass: string;
}

export function evaluateWebsiteState(
  website: {
    status: string;
    currentState: string;
    checkInterval: number;
    lastCheckedAt: Date | string | null;
    lastHttpStatus?: number | null;
    lastResponseTime?: number | null;
    statusReason?: string | null;
  },
  workerHeartbeat?: {
    lastHeartbeatAt: Date | string;
    workerStatus: string;
  } | null
): DisplayStateResult {
  const now = Date.now();

  // 1. Manually Paused
  if (website.currentState === "PAUSED") {
    return {
      displayStatus: "PAUSED",
      label: "Tạm dừng",
      isStale: false,
      evidence: "Người dùng chủ động tạm dừng theo dõi",
      dotColor: "bg-slate-400",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  // 2. Never Checked
  if (!website.lastCheckedAt) {
    return {
      displayStatus: "UNKNOWN",
      label: "Chưa có dữ liệu",
      isStale: false,
      evidence: "Chưa có lượt kiểm tra nào được hoàn tất",
      dotColor: "bg-slate-400",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  const lastCheckTime = new Date(website.lastCheckedAt).getTime();
  const elapsedSeconds = Math.round((now - lastCheckTime) / 1000);

  // 3. Worker Heartbeat Liveness Check (Requirement 14)
  if (workerHeartbeat) {
    const lastHeartbeatTime = new Date(workerHeartbeat.lastHeartbeatAt).getTime();
    const heartbeatElapsed = (now - lastHeartbeatTime) / 1000;
    if (heartbeatElapsed > 45) {
      // Worker is uncontactable
      return {
        displayStatus: "UNKNOWN",
        label: "Không xác định",
        isStale: true,
        evidence: `Worker giám sát đã dừng (Heartbeat cuối: ${Math.round(heartbeatElapsed)}s trước)`,
        dotColor: "bg-slate-400",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
      };
    }
  }

  // 4. Stale Data Detection (Requirement 7)
  const acceptableStalenessSeconds = Math.max(website.checkInterval * 2, 600);
  if (elapsedSeconds > acceptableStalenessSeconds) {
    const elapsedMinutes = Math.round(elapsedSeconds / 60);
    return {
      displayStatus: "UNKNOWN",
      label: "Không xác định",
      isStale: true,
      evidence: `Dữ liệu quá hạn (${elapsedMinutes} phút trước) - Chưa nhận được kiểm tra mới`,
      dotColor: "bg-slate-400",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
    };
  }

  // 5. Fresh Status Evaluation
  const rawStatus = (website.status || "UNKNOWN").toUpperCase();

  if (rawStatus === "DOWN") {
    return {
      displayStatus: "DOWN",
      label: "Gặp lỗi",
      isStale: false,
      evidence: website.statusReason || `HTTP ${website.lastHttpStatus || "Lỗi kết nối"}`,
      dotColor: "bg-rose-500",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }

  if (rawStatus === "DEGRADED" || rawStatus === "WARNING") {
    return {
      displayStatus: "DEGRADED",
      label: "Cảnh báo",
      isStale: false,
      evidence: website.statusReason || `Thời gian phản hồi chậm (${website.lastResponseTime}ms)`,
      dotColor: "bg-amber-500",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  if (rawStatus === "UP") {
    return {
      displayStatus: "UP",
      label: "Hoạt động",
      isStale: false,
      evidence: website.statusReason || `HTTP ${website.lastHttpStatus || 200} OK (${website.lastResponseTime || 0}ms)`,
      dotColor: "bg-emerald-500",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  return {
    displayStatus: "UNKNOWN",
    label: "Không xác định",
    isStale: false,
    evidence: "Hệ thống chưa đủ bằng chứng để kết luận trạng thái",
    dotColor: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  };
}
