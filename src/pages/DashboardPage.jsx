import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, CircularProgress, Grid,
} from '@mui/material';
import {
  PeopleOutlined, VideocamOutlined, DescriptionOutlined,
  AccountBalanceWalletOutlined, TrendingUpOutlined,
} from '@mui/icons-material';
import { fetchLeads } from '../features/leads/leadsSlice';
import { fetchRecentActivities } from '../features/activities/activitiesSlice';
import PageWrapper from '../components/common/PageWrapper';
import { formatLakh } from '../utils/formatCurrency';
import { timeAgo } from '../utils/formatDate';
import axiosInstance from '../api/axiosInstance';
import { DASHBOARD } from '../api/endpoints';

const FUNNEL_STAGES = [
  { label: 'New', status: 'NEW', color: '#5A5A56' },
  { label: 'AI Called', status: 'AI_CALL_DONE_INTERESTED', color: '#534AB7' },
  { label: 'In Follow-up', status: 'IN_FOLLOW_UP', color: '#185FA5' },
  { label: 'Demo', status: 'DEMO_SCHEDULED', color: '#0F6E56' },
  { label: 'Quote', status: 'QUOTATION_SENT', color: '#BA7517' },
  { label: 'Converted', status: 'CONVERTED_WON', color: '#3B6D11' },
];

const ACTIVITY_COLORS = {
  CALL: '#185FA5', WHATSAPP: '#3B6D11', EMAIL: '#5A5A56',
  AI_CALL: '#534AB7', STATUS_CHANGE: '#BA7517', NOTE: '#5A5A56',
};

function MetricCard({ label, value, icon: Icon, delta, color, progress }) {
  return (
    <Card>
      <CardContent sx={{ p: '16px 20px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </Typography>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '7px',
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 15, color }} />
          </Box>
        </Box>
        <Typography sx={{ fontSize: 22, fontWeight: 300, fontFamily: 'DM Mono', color: '#1A1A18', mb: 0.5 }}>
          {value}
        </Typography>
        {delta !== undefined && (
          <Typography
            sx={{
              fontSize: 11,
              color: delta >= 0 ? '#3B6D11' : '#A32D2D',
              fontWeight: 500,
            }}
          >
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% this month
          </Typography>
        )}
        {progress !== undefined && (
          <Box
            sx={{
              height: 2,
              background: '#F0EEE9',
              borderRadius: 1,
              mt: 1.5,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${Math.min(progress, 100)}%`,
                background: color,
                borderRadius: 1,
                transition: 'width 0.6s ease',
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { leads } = useSelector((state) => state.leads);
  const { recentActivities, loading: activitiesLoading } = useSelector((state) => state.activities);

  const [summary, setSummary] = React.useState(null);
  const [funnelData, setFunnelData] = React.useState({});

  useEffect(() => {
    dispatch(fetchLeads({ size: 100 }));
    dispatch(fetchRecentActivities());

    axiosInstance.get(DASHBOARD.SUMMARY).then((r) => setSummary(r.data?.data)).catch(() => {});

    const fetchFunnel = async () => {
      const data = {};
      await Promise.all(
        FUNNEL_STAGES.map(async (stage) => {
          try {
            const r = await axiosInstance.get('/leads', { params: { status: stage.status, size: 1 } });
            const d = r.data?.data;
            data[stage.status] = d?.totalElements ?? (Array.isArray(d) ? d.length : 0);
          } catch {
            data[stage.status] = 0;
          }
        })
      );
      setFunnelData(data);
    };
    fetchFunnel();
  }, [dispatch]);

  const totalLeads = summary?.totalLeads ?? leads.length;
  const demosBooked = summary?.demosBooked ?? leads.filter((l) => ['DEMO_SCHEDULED','DEMO_DONE'].includes(l.leadStatus)).length;
  const quotationsSent = summary?.quotationsSent ?? leads.filter((l) => l.leadStatus === 'QUOTATION_SENT').length;
  const pipelineValue = summary?.pipelineValue ?? leads.reduce((s, l) => s + (l.estimatedDealValue || 0), 0);
  const converted = leads.filter((l) => l.leadStatus === 'CONVERTED_WON').length;
  const convRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

  const maxFunnelCount = Math.max(...Object.values(funnelData), 1);

  return (
    <PageWrapper title="Dashboard">
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 0.5 }}>Dashboard</Typography>
        <Typography sx={{ fontSize: 13, color: '#5A5A56' }}>
          Welcome back · Here's your sales overview
        </Typography>
      </Box>

      {/* Row 1 — Metric cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Leads', value: totalLeads, icon: PeopleOutlined, color: '#185FA5', delta: 12, progress: 68 },
          { label: 'Demos Booked', value: demosBooked, icon: VideocamOutlined, color: '#0F6E56', delta: 8, progress: 45 },
          { label: 'Quotations Sent', value: quotationsSent, icon: DescriptionOutlined, color: '#BA7517', delta: -3, progress: 30 },
          { label: 'Pipeline Value', value: formatLakh(pipelineValue), icon: AccountBalanceWalletOutlined, color: '#534AB7', delta: 15, progress: 72 },
          { label: 'Conversion Rate', value: `${convRate}%`, icon: TrendingUpOutlined, color: '#3B6D11', delta: 2, progress: convRate },
        ].map((m) => (
          <Grid item xs={12} sm={6} md key={m.label}>
            <MetricCard {...m} />
          </Grid>
        ))}
      </Grid>

      {/* Row 2 — Recent Activity + Conversion Funnel */}
      <Grid container spacing={2}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: '16px 20px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2 }}>Recent Activity</Typography>
              {activitiesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
              ) : recentActivities.length === 0 ? (
                <Typography sx={{ fontSize: 12, color: '#5A5A56', textAlign: 'center', py: 4 }}>
                  No recent activities
                </Typography>
              ) : (
                <Box>
                  {recentActivities.slice(0, 10).map((activity, i) => {
                    const dotColor = ACTIVITY_COLORS[activity.activityType] || '#5A5A56';
                    return (
                      <Box key={activity.id || i} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: dotColor,
                            mt: 0.75,
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1A1A18' }}>
                            {activity.activityType?.replace('_', ' ')}
                            {activity.companyName && (
                              <span style={{ color: '#185FA5', cursor: 'pointer', fontWeight: 400, marginLeft: 4 }}
                                onClick={() => activity.leadId && navigate(`/leads/${activity.leadId}`)}>
                                · {activity.companyName}
                              </span>
                            )}
                          </Typography>
                          {activity.summary && (
                            <Typography sx={{ fontSize: 11, color: '#5A5A56', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {activity.summary}
                            </Typography>
                          )}
                          <Typography sx={{ fontSize: 10, fontFamily: 'DM Mono', color: '#5A5A56' }}>
                            {timeAgo(activity.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Conversion Funnel */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: '16px 20px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2.5 }}>Conversion Funnel</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {FUNNEL_STAGES.map((stage) => {
                  const count = funnelData[stage.status] || 0;
                  const pct = maxFunnelCount > 0 ? (count / maxFunnelCount) * 100 : 0;
                  return (
                    <Box key={stage.status} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontSize: 11, color: '#5A5A56', width: 90, flexShrink: 0, textAlign: 'right' }}>
                        {stage.label}
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          height: 20,
                          background: '#F0EEE9',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${pct}%`,
                            background: stage.color,
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            pr: 0.75,
                            minWidth: count > 0 ? 24 : 0,
                            transition: 'width 0.8s ease',
                          }}
                        >
                          {count > 0 && (
                            <Typography sx={{ fontSize: 10, fontFamily: 'DM Mono', color: '#fff', fontWeight: 600 }}>
                              {count}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', color: '#5A5A56', width: 30, textAlign: 'right', flexShrink: 0 }}>
                        {count}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageWrapper>
  );
}
