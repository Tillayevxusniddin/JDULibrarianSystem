// src/pages/librarian/AllLoansPage.tsx

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  ButtonGroup,
  Tabs,
  Tab,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { responsiveTableSx } from "../../components/common/tableResponsive";
import ConfirmationDialog from "../../components/common/ConfirmationDialog";
import api from "../../api";
import type { Loan, LoanStatus } from "../../types";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import toast from "react-hot-toast";
import generateLoanHistoryPdf from "../../utils/generateLoanHistoryPdf";

const getStatusChip = (status: LoanStatus) => {
  const color =
    status === "ACTIVE"
      ? "primary"
      : status === "OVERDUE"
        ? "error"
        : status === "PENDING_RETURN"
          ? "warning"
          : "success";
  return (
    <Chip
      label={status.replace("_", " ")}
      color={color}
      size="small"
      sx={{ fontWeight: "bold" }}
    />
  );
};

const AllLoansPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"renewal" | "active" | "history">(
    "active"
  );
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    loanId: number | null;
  }>({ open: false, loanId: null });
  const pendingReturnRef = useRef<{ loanId: number; toastId: string } | null>(null);

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Loan[]>("/loans", { params: { filter } });
      setLoans(response.data);
    } catch (err) {
      // Network/API xatosini ko'rsatamiz
      const errorMessage = "Ijaralarni yuklashda xatolik yuz berdi.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Loan fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleAction = async (
    action: () => Promise<any>,
    successMessage: string
  ) => {
    try {
      await action();
      toast.success(successMessage);
      fetchLoans();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Amalni bajarishda xatolik yuz berdi.";
      toast.error(message);
    }
  };

  const handleReturnClick = (loanId: number) => {
    setConfirmDialog({ open: true, loanId });
  };

  const handleConfirmReturn = async () => {
    const loanId = confirmDialog.loanId;
    setConfirmDialog({ open: false, loanId: null });

    if (!loanId) return;

    // Optimistic update: remove the loan from the list immediately
    setLoans((prevLoans) => prevLoans.filter((loan) => loan.id !== loanId));

    pendingReturnRef.current = { loanId, toastId: "" };

    const actionToastId = toast(
      (t) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            minWidth: "300px",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Kitob qaytarilmoqda...
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="warning"
            onClick={() => {
              if (pendingReturnRef.current?.loanId === loanId) {
                pendingReturnRef.current = null;
                toast.dismiss(t.id);
                toast.success("Qaytarish bekor qilindi");
                // Revert optimistic update
                fetchLoans();
              }
            }}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 2,
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
              },
            }}
          >
            Bekor qilish
          </Button>
        </Box>
      ),
      {
        duration: 5000,
      }
    );

    pendingReturnRef.current.toastId = actionToastId;

    setTimeout(async () => {
      if (pendingReturnRef.current?.loanId === loanId) {
        try {
          await api.post(`/loans/${loanId}/direct-return`);
          toast.success("Kitob muvaffaqiyatli qaytarildi!", { id: actionToastId });
        } catch (error: any) {
          const message =
            error.response?.data?.message || "Kitobni qaytarishda xatolik yuz berdi.";
          toast.error(message, { id: actionToastId });
          // Revert optimistic update on error
          fetchLoans();
        }
        pendingReturnRef.current = null;
      }
    }, 5000);
  };

  const handleCancelReturn = () => {
    setConfirmDialog({ open: false, loanId: null });
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Ijaralarni Boshqarish
        </Typography>
        {filter === "history" && loans.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<DownloadIcon />}
            sx={{
              borderRadius: 2,
              boxShadow: 1,
              textTransform: "none",
              fontWeight: 600,
            }}
            // Use PNG or JPEG for pdfmake compatibility; fallback without logo if not present
            onClick={() =>
              generateLoanHistoryPdf(loans, { logoUrl: "/logo.png" })
            }
          >
            Download History
          </Button>
        )}
      </Box>
      <Paper sx={{ borderRadius: 4, overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={filter}
            onChange={(_, newValue) => setFilter(newValue)}
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                minHeight: 48,
                textTransform: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                flex: 1,
                maxWidth: "none",
              },
              "& .MuiTabs-flexContainer": {
                justifyContent: "space-between",
              },
            }}
          >
            <Tab label="Muddat Uzaytirish" value="renewal" />
            <Tab label="Barcha Aktiv Ijaralar" value="active" />
            <Tab label="Ijara Tarixi" value="history" />
          </Tabs>
        </Box>
        {loans.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              Bu bo'limda hozircha yozuvlar mavjud emas.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table
              sx={{
                ...responsiveTableSx,
                minWidth: { md: 650 },
                tableLayout: { md: "fixed" },
              }}
            >
              <TableHead>
                <TableRow>
                  {/* --- YAXSHILANGAN: Chiziqlar olib tashlandi, teng masofada taqsimlandi --- */}
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      width: "25%",
                      px: 4,
                      py: 2,
                    }}
                  >
                    Kitob
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      width: "25%",
                      px: 4,
                      py: 2,
                    }}
                  >
                    Foydalanuvchi
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      width: "25%",
                      px: 4,
                      py: 2,
                    }}
                  >
                    Qaytarish Muddati
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      width: "25%",
                      px: 4,
                      py: 2,
                    }}
                  >
                    Statusi
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      width: "25%",
                      px: 4,
                      py: 2,
                    }}
                  >
                    Harakatlar
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow
                    key={loan.id}
                    hover
                    sx={{
                      "&:hover": { backgroundColor: "#f8f9fa" },
                    }}
                  >
                    <TableCell
                      data-label="Kitob"
                      sx={{
                        px: 4,
                        py: 3,
                        fontWeight: 500,
                      }}
                    >
                      {loan.bookCopy.book.title}
                    </TableCell>
                    <TableCell
                      data-label="Foydalanuvchi"
                      sx={{
                        px: 4,
                        py: 3,
                      }}
                    >
                      {loan.user.firstName} {loan.user.lastName}
                    </TableCell>
                    <TableCell
                      data-label="Qaytarish Muddati"
                      sx={{
                        px: 4,
                        py: 3,
                      }}
                    >
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell
                      data-label="Statusi"
                      sx={{
                        px: 4,
                        py: 3,
                      }}
                    >
                      {getStatusChip(loan.status)}
                    </TableCell>
                    <TableCell
                      data-label="Harakatlar"
                      align="right"
                      sx={{
                        px: 4,
                        py: 3,
                      }}
                    >
                      {(loan.status === "ACTIVE" || loan.status === "OVERDUE") && (
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                          {loan.renewalRequested && (
                            <ButtonGroup
                              variant="outlined"
                              size="small"
                              sx={{
                                "& .MuiButton-root": { minWidth: "auto", px: 1.5 },
                              }}
                            >
                              <Button
                                color="success"
                                onClick={() =>
                                  handleAction(
                                    () =>
                                      api.post(`/loans/${loan.id}/approve-renewal`),
                                    "So`rov tasdiqlandi!"
                                  )
                                }
                              >
                                <CheckCircleIcon fontSize="small" />
                              </Button>
                              <Button
                                color="error"
                                onClick={() =>
                                  handleAction(
                                    () =>
                                      api.post(`/loans/${loan.id}/reject-renewal`),
                                    "So`rov rad etildi!"
                                  )
                                }
                              >
                                <CancelIcon fontSize="small" />
                              </Button>
                            </ButtonGroup>
                          )}
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            sx={{ minWidth: "auto", px: 2 }}
                            onClick={() => handleReturnClick(loan.id)}
                          >
                            Qaytarish
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <ConfirmationDialog
        open={confirmDialog.open}
        title="Kitobni qaytarishni tasdiqlang"
        message="Haqiqatan ham bu kitobni qaytarilgan deb belgilamoqchimisiz?"
        onConfirm={handleConfirmReturn}
        onCancel={handleCancelReturn}
        confirmText="Qaytarish"
        cancelText="Bekor qilish"
        confirmColor="success"
      />
    </Box>
  );
};

export default AllLoansPage;
