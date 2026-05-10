import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, InputBase, Button, Chip,
  CircularProgress, Checkbox, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import { AutoAwesomeOutlined, SearchOutlined, AddOutlined } from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  searchLeads, bulkCreateLeads, toggleSelected, selectAll, clearSelected,
} from '../features/ai-search/aiSearchSlice';
import ApiErrorAlert from '../components/common/ApiErrorAlert';
import PageWrapper from '../components/common/PageWrapper';

const SUGGESTIONS = [
  'Casting manufacturers in Rajkot',
  'Auto component suppliers in Pune',
  'Foundry companies Tamil Nadu',
  'MSME steel fabricators in Surat',
];

const CONFIDENCE_COLORS = {
  HIGH: { bg: '#EAF3DE', text: '#3B6D11' },
  MEDIUM: { bg: '#FAEEDA', text: '#BA7517' },
  LOW: { bg: '#FCEBEB', text: '#A32D2D' },
};

export default function AiSearchPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { results, loading, error, selectedIds, bulkCreateLoading, lastQuery } = useSelector(
    (state) => state.aiSearch
  );
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query.trim()) { toast.error('Enter a search query'); return; }
    dispatch(searchLeads(query.trim()));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleAddSelected = async () => {
    const selected = results.filter(
      (r) => selectedIds.includes(r.id || r.companyName) && !r.existsInCrm
    );
    if (selected.length === 0) { toast.error('Select at least one company'); return; }
    const result = await dispatch(bulkCreateLeads(selected));
    if (bulkCreateLeads.fulfilled.match(result)) {
      navigate('/leads');
    } else {
      toast.error(result.payload || 'Bulk create failed');
    }
  };

  const allSelectableIds = results.filter((r) => !r.existsInCrm).map((r) => r.id || r.companyName);
  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedIds.includes(id));

  const handleSelectAll = () => {
    if (allSelected) {
      dispatch(clearSelected());
    } else {
      dispatch(selectAll());
    }
  };

  return (
    <PageWrapper title="AI Lead Search">
      {/* AI Query Panel */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #EEEDFE 0%, #F7F6F3 100%)' }}>
        <CardContent sx={{ p: '28px 32px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Chip
              icon={<AutoAwesomeOutlined sx={{ fontSize: 13, color: '#534AB7 !important' }} />}
              label="AI Powered"
              size="small"
              sx={{ background: '#EEEDFE', color: '#534AB7', fontWeight: 600, fontSize: 11 }}
            />
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1A1A18', mb: 0.5 }}>
            Natural Language Lead Discovery
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#5A5A56', mb: 3 }}>
            Describe the companies you're looking for in plain English
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              background: '#FFFFFF',
              border: '1px solid #E3E1DA',
              borderRadius: '12px',
              p: 1,
              mb: 2,
              alignItems: 'center',
            }}
          >
            <SearchOutlined sx={{ color: '#5A5A56', ml: 1, flexShrink: 0 }} />
            <InputBase
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Give me Foundry type industries in Coimbatore with 50+ employees"
              sx={{ flex: 1, fontSize: 14, fontFamily: 'DM Sans' }}
              inputProps={{ 'aria-label': 'AI lead search' }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              sx={{ background: '#534AB7', '&:hover': { background: '#3f37a0' }, height: 40, px: 3, flexShrink: 0 }}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : 'Search'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: 12, color: '#5A5A56', alignSelf: 'center' }}>Try:</Typography>
            {SUGGESTIONS.map((s) => (
              <Chip
                key={s}
                label={s}
                size="small"
                clickable
                onClick={() => { setQuery(s); dispatch(searchLeads(s)); }}
                sx={{
                  fontSize: 11,
                  background: '#FFFFFF',
                  border: '1px solid #E3E1DA',
                  '&:hover': { background: '#F7F6F3' },
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {error && <ApiErrorAlert error={error} />}

      {/* Results */}
      {loading && (
        <Card>
          <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <Box sx={{ textAlign: 'center' }}>
              <AutoAwesomeOutlined sx={{ fontSize: 32, color: '#534AB7', mb: 1, opacity: 0.6 }} />
              <Typography sx={{ fontSize: 13, color: '#5A5A56' }}>
                AI is searching for matching companies…
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <Card>
          <CardContent sx={{ p: '16px 20px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                  {results.length} companies found
                </Typography>
                {lastQuery && (
                  <Typography sx={{ fontSize: 12, color: '#5A5A56' }}>
                    for "{lastQuery}"
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedIds.length > 0 && !allSelected}
                  onChange={handleSelectAll}
                  size="small"
                />
                <Typography sx={{ fontSize: 12, color: '#5A5A56' }}>
                  {selectedIds.length} selected
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={bulkCreateLoading ? <CircularProgress size={14} color="inherit" /> : <AddOutlined />}
                  disabled={selectedIds.length === 0 || bulkCreateLoading}
                  onClick={handleAddSelected}
                >
                  Add Selected as Leads
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Company</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Industry</TableCell>
                    <TableCell>Employees</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>CRM Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result, i) => {
                    const rowId = result.id || result.companyName;
                    const isSelected = selectedIds.includes(rowId);
                    const confColors = CONFIDENCE_COLORS[result.confidenceScore] || CONFIDENCE_COLORS.MEDIUM;

                    return (
                      <TableRow
                        key={rowId || i}
                        sx={{
                          background: result.existsInCrm ? '#FFFBF0' : 'transparent',
                          opacity: result.existsInCrm ? 0.8 : 1,
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            disabled={result.existsInCrm}
                            onChange={() => dispatch(toggleSelected(rowId))}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1A1A18' }}>
                            {result.companyName}
                          </Typography>
                          {(result.phone || result.email) && (
                            <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>
                              {[result.phone, result.email].filter(Boolean).join(' · ')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12 }}>{result.city || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          {result.industryType ? (
                            <Chip
                              label={result.industryType}
                              size="small"
                              sx={{ fontSize: 10, height: 20, background: '#F0EEE9', color: '#5A5A56' }}
                            />
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, fontFamily: 'DM Mono' }}>
                            {result.employeeSize || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              background: confColors.bg,
                              color: confColors.text,
                              borderRadius: 999,
                              padding: '2px 8px',
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {result.confidenceScore || 'MEDIUM'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {result.existsInCrm ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                background: '#FAEEDA',
                                color: '#BA7517',
                                borderRadius: 999,
                                padding: '2px 8px',
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              Already Added
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#5A5A56' }}>Not in CRM</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
