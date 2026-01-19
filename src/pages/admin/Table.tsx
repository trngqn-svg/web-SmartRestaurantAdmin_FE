import { useEffect, useState, useRef } from "react";
import type { Table } from "../../types/tables";
import {
  getTables,
  createTable,
  getTableQR,
  updateTable,
  generateTableQR,
  updateTableStatus,
  regenerateAllTableQR,
  downloadAllTableQRs,
} from "../../api/admin/tables";
import { saveAs } from "file-saver";
import StatsCard from "../../components/tables/StatsCard";
import TablesGrid from "../../components/tables/TablesGrid";
import QRCodeModal from "../../components/tables/QRCodeModal";
import TableForm from "../../components/tables/TableForm";
import {
  Plus,
  Download,
  RefreshCcw,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import type { Socket } from "socket.io-client";
import { connectStaffSocket } from "../../ws/staffSocket";
import { message } from "antd";

function errMsg(e: any, fallback: string) {
  return e?.response?.data?.message ?? e?.message ?? fallback;
}

const Tables = () => {
  const [msgApi, msgCtx] = message.useMessage();

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  const [confirmRegenAllOpen, setConfirmRegenAllOpen] = useState(false);
  const [regenAllLoading, setRegenAllLoading] = useState(false);
  const [regenAllError, setRegenAllError] = useState<string | null>(null);

  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Table | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) socketRef.current = connectStaffSocket();

    const socket = socketRef.current;

    const onTableStatusChanged = (p: any) => {
      setTables((prev) =>
        prev.map((t) =>
          String(t.id) === String(p.tableId)
            ? { ...t, status: p.status ?? t.status }
            : t
        )
      );
    };

    socket.on("table.status_changed", onTableStatusChanged);
    return () => {
      socket.off("table.status_changed", onTableStatusChanged);
    };
  }, []);

  const [qrData, setQrData] = useState<{
    tableId: string;
    tableName: string;
    capacity?: number;
    location?: string;
    qrUrl: string;
    createdAt?: string;
    scansToday?: number;
  } | null>(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await getTables();
      setTables(data);
    } catch (e: any) {
      msgApi.error(errMsg(e, "Failed to load tables"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetQR = async (table: Table) => {
    try {
      const res = await getTableQR(table.id);
      setQrData({
        tableId: table.id,
        tableName: table.tableNumber,
        capacity: table.capacity,
        location: table.location,
        qrUrl: res.qrUrl,
        createdAt: res.createdAt,
      });
    } catch (e: any) {
      msgApi.error(errMsg(e, "Failed to load QR"));
    }
  };

  const handleRegenerateQR = async (tableId: string) => {
    try {
      const res = await generateTableQR(tableId);
      setQrData((prev) =>
        prev
          ? { ...prev, qrUrl: res.qrUrl, createdAt: res.createdAt }
          : null
      );
      msgApi.success("QR regenerated");
    } catch (e: any) {
      msgApi.error(errMsg(e, "Failed to regenerate QR"));
    }
  };

  const askToggleStatus = (table: Table) => {
    setToggleError(null);
    setToggleTarget(table);
    setConfirmToggleOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!toggleTarget) return;

    try {
      setToggleLoading(true);
      setToggleError(null);

      const newStatus =
        toggleTarget.status === "active" ? "inactive" : "active";

      await updateTableStatus(toggleTarget.id, newStatus);

      msgApi.success(
        newStatus === "active" ? "Table activated" : "Table deactivated"
      );

      setConfirmToggleOpen(false);
      setToggleTarget(null);
      await fetchTables();
    } catch (e: any) {
      const msg = errMsg(e, "Failed to change table status");
      setToggleError(msg);
      msgApi.error(msg);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setOpenForm(true);
  };

  const handleSubmitTable = async (data: Partial<Table>) => {
    try {
      if (editingTable) {
        await updateTable(editingTable.id, data);
        msgApi.success("Table updated");
      } else {
        await createTable(data);
        msgApi.success("Table created");
      }
      setOpenForm(false);
      setEditingTable(null);
      await fetchTables();
    } catch (e: any) {
      msgApi.error(errMsg(e, "Save table failed"));
      throw e; // nếu TableForm đang expect throw để show field error
    }
  };

  const handleDownloadAllQR = async () => {
    try {
      const blob = await downloadAllTableQRs("zip");
      saveAs(blob, "all-tables-qr.zip");
      msgApi.success("Downloaded all QR");
    } catch (e: any) {
      msgApi.error(errMsg(e, "Download failed"));
    }
  };

  const askRegenerateAllQR = () => {
    setRegenAllError(null);
    setConfirmRegenAllOpen(true);
  };

  const confirmRegenerateAllQR = async () => {
    try {
      setRegenAllLoading(true);
      setRegenAllError(null);

      await regenerateAllTableQR();

      msgApi.success("Regenerated all QR codes");

      setConfirmRegenAllOpen(false);
      await fetchTables();
    } catch (e: any) {
      const msg = errMsg(e, "Failed to regenerate QR codes");
      setRegenAllError(msg);
      msgApi.error(msg);
    } finally {
      setRegenAllLoading(false);
    }
  };

  const total = tables.length;
  const active = tables.filter((t) => t.status === "active").length;
  const occupied = tables.filter((t) => t.status === "occupied").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-8 font-sans">
      {msgCtx}

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Table Management
          </h1>
          <p className="text-slate-500 font-medium">
            Manage restaurant floor plan & generate secure QR codes
          </p>
        </div>

        <button
          onClick={() => setOpenForm(true)}
          className="inline-flex items-center justify-center cursor-pointer px-6 py-3 gap-2 bg-[#1A2F2F] hover:bg-[#E2B13C] hover:text-[#1A2F2F] rounded-lg text-sm font-bold text-white transition-all shadow-sm active:scale-95"
        >
          <Plus size={20} strokeWidth={2.5} />
          Add New Table
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          label="Total Tables"
          value={total}
          variant="total"
          icon={<Layers className="text-slate-600" />}
        />
        <StatsCard
          label="Active"
          value={active}
          variant="active"
          icon={<CheckCircle2 className="text-emerald-600" />}
        />
        <StatsCard
          label="Occupied"
          value={occupied}
          variant="occupied"
          icon={<AlertCircle className="text-amber-600" />}
        />
      </div>

      {/* All table sections */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">
            Restaurant Floor Map
          </h3>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadAllQR}
              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition-all text-sm"
            >
              <Download size={16} />
              Download All QR
            </button>

            <button
              onClick={askRegenerateAllQR}
              className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg font-bold hover:bg-orange-100 transition-all text-sm"
            >
              <RefreshCcw size={16} />
              Regenerate All
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-slate-400 font-medium">Loading layout...</p>
            </div>
          ) : (
            <TablesGrid
              tables={tables}
              onGetQR={handleGetQR}
              onEdit={handleEdit}
              onToggleStatus={askToggleStatus}
            />
          )}
        </div>
      </div>

      {qrData && (
        <QRCodeModal
          open
          onClose={() => setQrData(null)}
          tableId={qrData.tableId}
          tableName={qrData.tableName}
          capacity={qrData.capacity}
          location={qrData.location}
          qrUrl={qrData.qrUrl}
          createdAt={qrData.createdAt}
          scansToday={qrData.scansToday}
          onRegenerate={handleRegenerateQR}
        />
      )}

      <TableForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditingTable(null);
        }}
        onSubmit={handleSubmitTable}
        existingTables={tables}
        initialData={editingTable ?? undefined}
      />

      {confirmRegenAllOpen && (
        <ConfirmDialog
          title="Regenerate all QR codes?"
          message="Regenerating will invalidate previous codes. Use this only if the table link needs to be reset."
          confirmText={regenAllLoading ? "Regenerating..." : "Regenerate"}
          cancelText="Cancel"
          disabled={regenAllLoading}
          error={regenAllError}
          onCancel={() => !regenAllLoading && setConfirmRegenAllOpen(false)}
          onConfirm={confirmRegenerateAllQR}
        />
      )}

      {confirmToggleOpen && toggleTarget && (
        <ConfirmDialog
          title={
            toggleTarget.status === "active"
              ? `Deactivate table ${toggleTarget.tableNumber}?`
              : `Activate table ${toggleTarget.tableNumber}?`
          }
          message={
            toggleTarget.status === "active"
              ? "Do you want to deactive this table?"
              : "This will make the table available again."
          }
          confirmText={toggleLoading ? "Saving..." : "Confirm"}
          cancelText="Cancel"
          disabled={toggleLoading}
          error={toggleError}
          onCancel={() => {
            if (toggleLoading) return;
            setConfirmToggleOpen(false);
            setToggleTarget(null);
            setToggleError(null);
          }}
          onConfirm={confirmToggleStatus}
        />
      )}
    </div>
  );
};

const ConfirmDialog = ({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  disabled,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  disabled?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-base sm:text-lg font-black text-slate-800">
                {title}
              </h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              aria-label="Close"
              type="button"
              disabled={disabled}
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
              <p className="text-sm font-semibold text-rose-700">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {disabled ? <Loader2 className="animate-spin" size={16} /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tables;
