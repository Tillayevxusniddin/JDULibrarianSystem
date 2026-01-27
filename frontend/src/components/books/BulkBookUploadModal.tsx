import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Link
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import api from '../../api';
import toast from 'react-hot-toast';
// import * as XLSX from 'xlsx'; // Copilot: Lazy loaded below

interface BulkBookUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadResult {
  stats: {
    createdBooks: number;
    createdCopies: number;
    failedCount: number;
  };
  failedRows: {
    row: number | string;
    data: unknown[]; // Copilot: Better typing than any[]
    reason: string;
  }[];
}

const getErrorType = (reason: string): string => {
  if (reason.includes("Shtrix-kod bazada allaqachon mavjud")) return "Mavjud Shtrix-kodlar (Bazada)";
  if (reason.includes("Fayl ichida takrorlangan")) return "Takrorlangan Shtrix-kodlar (Fayl ichida)";
  if (reason.includes("Barcode, Title yoki Category")) return "Ma'lumotlar Yetishmovchiligi";
  return "Boshqa Xatoliklar";
};

const BulkBookUploadModal: React.FC<BulkBookUploadModalProps> = ({ open, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  // Download Dialog State
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'xlsx' | 'xls' | 'csv'>('xlsx');
  const [selectedErrorTypes, setSelectedErrorTypes] = useState<Set<string>>(new Set());

  // Available error types in the current result
  const availableErrorTypes = useMemo(() => {
    if (!result) return [];
    const types = new Set<string>();
    result.failedRows.forEach(row => types.add(getErrorType(row.reason)));
    return Array.from(types);
  }, [result]);

  // Select all error types by default when result changes
  useEffect(() => {
    if (availableErrorTypes.length > 0) {
      setSelectedErrorTypes(new Set(availableErrorTypes));
    }
  }, [availableErrorTypes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
      setResult(null); // Reset result when file changes
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    setDownloadDialogOpen(false);
    onClose();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Iltimos, avval faylni tanlang.');
      return;
    }
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('booksFile', selectedFile);

    try {
      const response = await api.post('/books/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const data = response.data;
      if (data.failedRows && data.failedRows.length > 0) {
        setResult(data);
        toast.error(`${data.stats.failedCount} ta qatorda xatolik yuz berdi.`);
      } else {
        toast.success(data.message);
        onSuccess();
        handleClose();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || "Faylni yuklashda xatolik yuz berdi.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleErrorType = (type: string) => {
    const newSet = new Set(selectedErrorTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedErrorTypes(newSet);
  };

  const toggleAllErrorTypes = (checked: boolean) => {
    if (checked) {
      setSelectedErrorTypes(new Set(availableErrorTypes));
    } else {
      setSelectedErrorTypes(new Set());
    }
  };

  const handleDownload = async () => {
    if (!result || !result.failedRows.length) return;

    // Filter rows
    const filteredRows = result.failedRows.filter(fail => 
      selectedErrorTypes.has(getErrorType(fail.reason))
    );

    if (filteredRows.length === 0) {
      toast.error("Tanlangan filtrlarga mos xatoliklar topilmadi.");
      return;
    }

    try {
        // Copilot: Lazy load xlsx
        const XLSX = await import('xlsx');

        // Prepare data for export
        const exportData = filteredRows.map((fail) => ({
        'Barcode': (fail.data as any[])[0] || '',
        'Title': (fail.data as any[])[1] || '',
        'Author': (fail.data as any[])[2] || '',
        'Category': (fail.data as any[])[3] || '',
        'Error Reason': fail.reason,
        'Original Row Number': fail.row,
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Failed Rows");

        // Generate file name with timestamp
        const date = new Date().toISOString().split('T')[0];
        const fileName = `upload_errors_${date}.${downloadFormat}`;

        // Write file
        XLSX.writeFile(wb, fileName);
        
        setDownloadDialogOpen(false);
        toast.success(`Xatoliklar hisoboti yuklandi (${downloadFormat})`);
    } catch (error) {
        console.error("Export error:", error);
        toast.error("Faylni yuklashda xatolik yuz berdi.");
    }
  };

  // Limit displayed rows
  const displayedErrors = result?.failedRows.slice(0, 50); // Show first 50
  const remainingErrors = (result?.failedRows.length || 0) - (displayedErrors?.length || 0);

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Kitoblarni Ommaviy Qo'shish</DialogTitle>
        <DialogContent dividers>
          {!result ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Kitoblarni ommaviy qo'shish uchun Excel (.xlsx) yoki CSV faylini yuklang.
              </Typography>
              
              {/* Low Saturation Info Box */}
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                bgcolor: 'action.hover', 
                borderRadius: 1, 
                borderLeft: '4px solid', 
                borderColor: 'info.main',
                display: 'flex',
                gap: 2
              }}>
                <InfoIcon color="info" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Kutilayotgan format (ustunlar ketma-ketligi):
                  </Typography>
                  <Typography variant="body2" component="div">
                    1. <code>Barcode</code> (Shtrix-kod) - <em>Majburiy</em><br />
                    2. <code>Title</code> (Kitob nomi) - <em>Majburiy</em><br />
                    3. <code>Author</code> (Muallif) - <em>Ixtiyoriy</em><br />
                    4. <code>Category</code> (Kategoriya) - <em>Majburiy</em>
                  </Typography>
                </Box>
              </Box>

              <Typography variant="caption" display="block" sx={{ mb: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                Izoh: Har bir qator alohida kitob nusxasi hisoblanadi. Bir xil nomli kitoblar avtomatik guruhlanadi.
              </Typography>

              <Box sx={{ 
                border: '2px dashed', 
                borderColor: 'divider', 
                p: 5, 
                textAlign: 'center', 
                borderRadius: 2, 
                // bgcolor removed for cleaner look
              }}>
                 <Typography variant="body2" sx={{ mb: 2 }}>
                  <Link href="https://library-system-assets.s3.ap-northeast-1.amazonaws.com/templates/books_template.xlsx" download underline="hover">
                     Excel shablonini yuklab olish
                  </Link>
                </Typography>
                <Button variant="contained" component="label" startIcon={<UploadFileIcon />} size="large">
                  Fayl Tanlash
                  <input type="file" hidden onChange={handleFileChange} accept=".xls,.xlsx,.csv" />
                </Button>
                {selectedFile && (
                  <Typography sx={{ mt: 2, fontWeight: 'medium' }}>
                    Tanlangan fayl: {selectedFile.name}
                  </Typography>
                )}
              </Box>
            </>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                {/* Low Saturation Success Box */}
                <Box sx={{ 
                  flex: 1, 
                  p: 2, 
                  bgcolor: 'action.hover', 
                  borderRadius: 1, 
                  borderLeft: '4px solid', 
                  borderColor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                   <CheckCircleIcon color="success" fontSize="large" />
                   <Box>
                     <Typography variant="subtitle2" fontWeight="bold">Muvaffaqiyatli:</Typography>
                     <Typography variant="body2">Yangi kitoblar: {result.stats.createdBooks}</Typography>
                     <Typography variant="body2">Yangi nusxalar: {result.stats.createdCopies}</Typography>
                   </Box>
                </Box>

                {/* Low Saturation Error Box */}
                <Box sx={{ 
                  flex: 1, 
                  p: 2, 
                  bgcolor: 'action.hover', 
                  borderRadius: 1, 
                  borderLeft: '4px solid', 
                  borderColor: 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                   <ErrorIcon color="error" fontSize="large" />
                   <Box>
                     <Typography variant="subtitle2" fontWeight="bold">Xatoliklar:</Typography>
                     <Typography variant="body2">{result.stats.failedCount} ta qator o'tkazib yuborildi</Typography>
                   </Box>
                </Box>
              </Box>

              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                Xatoliklar tafsiloti (Birinchi 50 ta):
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <List dense>
                  {displayedErrors?.map((fail, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" color="error">
                              Qator {fail.row}: {fail.reason}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              Data: {JSON.stringify(fail.data)}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                  {remainingErrors > 0 && (
                     <ListItem>
                        <ListItemText 
                            primary={
                                <Typography variant="body2" color="text.secondary" align="center">
                                    Va yana {remainingErrors} ta xatolik... Barchasini ko'rish uchun faylni yuklab oling.
                                </Typography>
                            }
                        />
                     </ListItem>
                  )}
                </List>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {result ? (
            <>
              <Button 
                onClick={() => setDownloadDialogOpen(true)}
                variant="outlined" 
                color="error"
                startIcon={<DownloadIcon />}
                sx={{ mr: 'auto' }}
              >
                Xatoliklarni Yuklash
              </Button>

              <Button onClick={() => { onSuccess(); handleClose(); }} variant="contained" color="primary">
                OK, Tushunarli
              </Button>
            </>
          ) : (
            <>
               <Button onClick={handleClose} color="inherit">Bekor qilish</Button>
               <Button onClick={handleUpload} variant="contained" disabled={!selectedFile || loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Yuklash va Boshlash"}
               </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Download Options Dialog */}
      <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Yuklash Sozlamalari</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Xatolik Turlari</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectedErrorTypes.size === availableErrorTypes.length && availableErrorTypes.length > 0}
                    indeterminate={selectedErrorTypes.size > 0 && selectedErrorTypes.size < availableErrorTypes.length}
                    onChange={(e) => toggleAllErrorTypes(e.target.checked)}
                  />
                }
                label="Barchasini belgilash"
              />
              <Divider sx={{ my: 1 }} />
              {availableErrorTypes.map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox 
                      checked={selectedErrorTypes.has(type)}
                      onChange={() => toggleErrorType(type)}
                    />
                  }
                  label={type}
                />
              ))}
            </FormGroup>
          </Box>

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Fayl Formati</FormLabel>
            <RadioGroup
              row
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value as 'xlsx' | 'xls' | 'csv')} // Copilot: Fixed cast
            >
              <FormControlLabel value="xlsx" control={<Radio />} label="Excel (.xlsx)" />
              <FormControlLabel value="xls" control={<Radio />} label=".xls" />
              <FormControlLabel value="csv" control={<Radio />} label=".csv" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDownloadDialogOpen(false)} color="inherit">Bekor qilish</Button>
          <Button onClick={handleDownload} variant="contained" color="primary" startIcon={<DownloadIcon />}>
            Yuklash
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkBookUploadModal;