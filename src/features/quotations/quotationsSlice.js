import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { QUOTATIONS } from '../../api/endpoints';
import toast from 'react-hot-toast';

export const fetchQuotations = createAsyncThunk(
  'quotations/fetchQuotations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(QUOTATIONS.LIST, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quotations');
    }
  }
);

export const fetchQuotationById = createAsyncThunk(
  'quotations/fetchQuotationById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(QUOTATIONS.GET_BY_ID(id));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quotation');
    }
  }
);

export const fetchNextNumber = createAsyncThunk(
  'quotations/fetchNextNumber',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(QUOTATIONS.NEXT_NUMBER);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get quotation number');
    }
  }
);

export const createQuotation = createAsyncThunk(
  'quotations/createQuotation',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(QUOTATIONS.CREATE, data);
      toast.success('Quotation saved successfully');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create quotation');
    }
  }
);

export const updateQuotation = createAsyncThunk(
  'quotations/updateQuotation',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(QUOTATIONS.UPDATE(id), data);
      toast.success('Quotation updated');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update quotation');
    }
  }
);

export const submitQuotationApproval = createAsyncThunk(
  'quotations/submitApproval',
  async ({ id, decision, remarks }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(QUOTATIONS.APPROVAL(id), { decision, remarks });
      toast.success(`Quotation ${decision === 'APPROVED' ? 'approved' : 'rejected'}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process approval');
    }
  }
);

export const sendQuotationEmail = createAsyncThunk(
  'quotations/sendEmail',
  async ({ id, subject, body }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(QUOTATIONS.SEND_EMAIL(id), { subject, body });
      toast.success('Quotation sent via email');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send email');
    }
  }
);

export const sendQuotationWhatsApp = createAsyncThunk(
  'quotations/sendWhatsApp',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(QUOTATIONS.SEND_WHATSAPP(id));
      toast.success('Quotation sent via WhatsApp');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send WhatsApp message');
    }
  }
);

export const reviseQuotation = createAsyncThunk(
  'quotations/revise',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(QUOTATIONS.REVISE(id));
      toast.success('New revision created');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create revision');
    }
  }
);

export const fetchQuotationsByLead = createAsyncThunk(
  'quotations/fetchByLead',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(QUOTATIONS.BY_LEAD(leadId));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch lead quotations');
    }
  }
);

export const updateLeadResponse = createAsyncThunk(
  'quotations/updateLeadResponse',
  async ({ id, leadResponse, followUpDate }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(QUOTATIONS.UPDATE_RESPONSE(id), { leadResponse, followUpDate });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update response');
    }
  }
);

const quotationsSlice = createSlice({
  name: 'quotations',
  initialState: {
    quotations: [],
    selectedQuotation: null,
    leadQuotations: [],
    nextNumber: '',
    loading: false,
    actionLoading: false,
    error: null,
    pagination: { page: 0, size: 20, totalElements: 0, totalPages: 0 },
    filters: { status: '', dateFrom: '', dateTo: '', assignedTo: '' },
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 0;
    },
    resetFilters(state) {
      state.filters = { status: '', dateFrom: '', dateTo: '', assignedTo: '' };
      state.pagination.page = 0;
    },
    setPagination(state, action) {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearSelectedQuotation(state) {
      state.selectedQuotation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (payload?.content) {
          state.quotations = payload.content;
          state.pagination = {
            page: payload.number ?? 0,
            size: payload.size ?? 20,
            totalElements: payload.totalElements ?? 0,
            totalPages: payload.totalPages ?? 0,
          };
        } else {
          state.quotations = Array.isArray(payload) ? payload : [];
        }
      })
      .addCase(fetchQuotations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchQuotationById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchQuotationById.fulfilled, (state, action) => { state.loading = false; state.selectedQuotation = action.payload; })
      .addCase(fetchQuotationById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchNextNumber.fulfilled, (state, action) => { state.nextNumber = action.payload; })

      .addCase(createQuotation.pending, (state) => { state.actionLoading = true; })
      .addCase(createQuotation.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.quotations.unshift(action.payload);
      })
      .addCase(createQuotation.rejected, (state) => { state.actionLoading = false; })

      .addCase(updateQuotation.pending, (state) => { state.actionLoading = true; })
      .addCase(updateQuotation.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.quotations.findIndex((q) => q.id === action.payload.id);
        if (idx !== -1) state.quotations[idx] = action.payload;
        if (state.selectedQuotation?.id === action.payload.id) state.selectedQuotation = action.payload;
      })
      .addCase(updateQuotation.rejected, (state) => { state.actionLoading = false; })

      .addCase(submitQuotationApproval.pending, (state) => { state.actionLoading = true; })
      .addCase(submitQuotationApproval.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.selectedQuotation?.id === action.payload?.id) state.selectedQuotation = action.payload;
      })
      .addCase(submitQuotationApproval.rejected, (state) => { state.actionLoading = false; })

      .addCase(sendQuotationEmail.pending, (state) => { state.actionLoading = true; })
      .addCase(sendQuotationEmail.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.selectedQuotation?.id === action.payload?.id) state.selectedQuotation = action.payload;
      })
      .addCase(sendQuotationEmail.rejected, (state) => { state.actionLoading = false; })

      .addCase(sendQuotationWhatsApp.pending, (state) => { state.actionLoading = true; })
      .addCase(sendQuotationWhatsApp.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.selectedQuotation?.id === action.payload?.id) state.selectedQuotation = action.payload;
      })
      .addCase(sendQuotationWhatsApp.rejected, (state) => { state.actionLoading = false; })

      .addCase(reviseQuotation.pending, (state) => { state.actionLoading = true; })
      .addCase(reviseQuotation.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(reviseQuotation.rejected, (state) => { state.actionLoading = false; })

      .addCase(updateLeadResponse.fulfilled, (state, action) => {
        if (state.selectedQuotation?.id === action.payload?.id) state.selectedQuotation = action.payload;
      })

      .addCase(fetchQuotationsByLead.fulfilled, (state, action) => {
        state.leadQuotations = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

export const { setFilters, resetFilters, setPagination, clearSelectedQuotation } = quotationsSlice.actions;
export default quotationsSlice.reducer;
