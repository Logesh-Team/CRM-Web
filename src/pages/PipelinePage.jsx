import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Chip, CircularProgress } from '@mui/material';
import GradeBadge from '../components/common/GradeBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import PageWrapper from '../components/common/PageWrapper';
import { formatLakh } from '../utils/formatCurrency';
import axiosInstance from '../api/axiosInstance';
import { LEADS } from '../api/endpoints';

const PIPELINE_STAGES = [
  { status: 'NEW', label: 'New', color: '#5A5A56' },
  { status: 'IN_FOLLOW_UP', label: 'In Follow-up', color: '#185FA5' },
  { status: 'DEMO_SCHEDULED', label: 'Demo Scheduled', color: '#0F6E56' },
  { status: 'QUOTATION_SENT', label: 'Quotation Sent', color: '#BA7517' },
  { status: 'NEGOTIATION', label: 'Negotiation', color: '#BA7517' },
  { status: 'CONVERTED_WON', label: 'Converted / Won', color: '#3B6D11' },
];

function LeadCard({ lead, onClick }) {
  return (
    <Card
      onClick={() => onClick(lead)}
      sx={{
        mb: 1.5,
        borderLeft: '3px solid',
        borderLeftColor: 'inherit',
        cursor: 'pointer',
        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        borderRadius: '8px',
      }}
    >
      <CardContent sx={{ p: '12px !important' }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5, color: '#1A1A18' }}>
          {lead.companyName}
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#5A5A56', mb: 1 }}>
          {lead.city || '—'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
          <GradeBadge grade={lead.leadGrade} />
          <PriorityBadge priority={lead.leadPriority} />
          {lead.estimatedDealValue && (
            <Typography sx={{ fontSize: 10, fontFamily: 'DM Mono', color: '#3B6D11', ml: 'auto' }}>
              {formatLakh(lead.estimatedDealValue)}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PipelinePage() {
  const navigate = useNavigate();
  const [columns, setColumns] = React.useState({});
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const results = {};
      await Promise.all(
        PIPELINE_STAGES.map(async (stage) => {
          try {
            const response = await axiosInstance.get(LEADS.LIST, {
              params: { status: stage.status, size: 50 },
            });
            const data = response.data.data;
            results[stage.status] = Array.isArray(data) ? data : (data?.content || []);
          } catch {
            results[stage.status] = [];
          }
        })
      );
      setColumns(results);
      setLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <PageWrapper title="Pipeline">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Pipeline</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: 400 }}>
          {PIPELINE_STAGES.map((stage) => {
            const leads = columns[stage.status] || [];
            const totalValue = leads.reduce((sum, l) => sum + (l.estimatedDealValue || 0), 0);
            return (
              <Box
                key={stage.status}
                sx={{ minWidth: 240, flex: '0 0 240px' }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    background: '#F7F6F3',
                    border: '1px solid #E3E1DA',
                    borderRadius: '8px 8px 0 0',
                    borderBottom: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }}
                  />
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#1A1A18',
                      flex: 1,
                    }}
                  >
                    {stage.label}
                  </Typography>
                  <Chip
                    label={leads.length}
                    size="small"
                    sx={{ height: 18, fontSize: 10, fontFamily: 'DM Mono', background: '#E3E1DA' }}
                  />
                </Box>
                {totalValue > 0 && (
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      background: '#F7F6F3',
                      border: '1px solid #E3E1DA',
                      borderTop: '1px dashed #E3E1DA',
                      borderBottom: 'none',
                    }}
                  >
                    <Typography sx={{ fontSize: 10, fontFamily: 'DM Mono', color: '#3B6D11' }}>
                      {formatLakh(totalValue)} total
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    border: '1px solid #E3E1DA',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    background: '#FAFAF9',
                    p: 1.5,
                    minHeight: 300,
                    sx: { borderLeft: `3px solid ${stage.color}` },
                  }}
                >
                  {leads.length === 0 ? (
                    <Typography sx={{ fontSize: 11, color: '#5A5A56', textAlign: 'center', pt: 4 }}>
                      No leads
                    </Typography>
                  ) : (
                    leads.map((lead) => (
                      <Box key={lead.id} sx={{ borderLeftColor: stage.color }}>
                        <LeadCard lead={lead} onClick={(l) => navigate(`/leads/${l.id}`)} />
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </PageWrapper>
  );
}
