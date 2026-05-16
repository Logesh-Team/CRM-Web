import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress,
  Chip, LinearProgress,
} from '@mui/material';
import {
  PeopleOutlined, AddCircleOutlineOutlined, EventNoteOutlined,
  WarningAmberOutlined, VideocamOutlined, AccountBalanceWalletOutlined,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import { DASHBOARD_EXEC } from '../../api/endpoints';
import PageWrapper from '../../components/common/PageWrapper';
import UpcomingDemosWidget from '../../components/Demos/UpcomingDemosWidget';
import EmptyState from '../../components/common/EmptyState';
import { formatINR } from '../../utils/formatCurrency';
import { formatDateTime, timeAgo } from '../../utils/formatDate';

const CHART_COLORS = ['#185FA5', '#534AB7', '#0F6E56', '#BA7517', '#A32D2D', '#3B6D11', '#5A5A56', '#1A1A18'];

const GRADE_COLORS = {
  A: '#3B6D11',
  B: '#185FA5',
  C: '#BA7517',
  D: '#A32D2D',
};

const ACTIVITY_COLORS = {
  CALL: '#185FA5',
  WHATSAPP: '#3B6D11',
  EMAIL: '#5A5A56',
  NOTE: '#BA7517',
  MEETING: '#534AB7',
};

function MetricCard({ label, value, icon: Icon, color, highlight }) {
  return (
    <Card sx={{ border: '1px solid #E3E1DA' }}>
      <CardContent sx={{ p: '16px 20px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </Typography>
          <Box sx={{ width: 28, height: 28, borderRadius: '7px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon sx={{ fontSize: 15, color }} />
          </Box>
        </Box>
        <Typography sx={{ fontSize: 22, fontWeight: 300, fontFamily: 'DM Mono', color: highlight ? '#A32D2D' : '#1A1A18' }}>
          {value ?? '—'}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function SalesExecutiveDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [leadsByStage, setLeadsByStage] = useState([]);
  const [leadsByGrade, setLeadsByGrade] = useState([]);
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [monthlyTarget, setMonthlyTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(() => {
    const promises = [
      // /exec/summary returns { totalLeads, newToday, inFollowUp, demoScheduled, convertedWon, closedLost, pipelineValue, overdueFollowUps }
      axiosInstance.get(DASHBOARD_EXEC.SUMMARY).then(r => {
        const s = r.data?.data;
        if (s) {
          setSummary({
            ...s,
            newThisMonth: s.newToday,
            todayFollowups: s.inFollowUp,
            overdueTasks: s.overdueFollowUps,
          });
        }
      }).catch(() => {}),
      // /exec/pipeline returns { stages: [{stage, count}], totalPipelineValue }
      axiosInstance.get(DASHBOARD_EXEC.LEADS_BY_STAGE).then(r => setLeadsByStage(r.data?.data?.stages ?? [])).catch(() => {}),
      axiosInstance.get(DASHBOARD_EXEC.LEADS_BY_GRADE).then(r => setLeadsByGrade(r.data?.data ?? [])).catch(() => {}),
      // /exec/follow-ups returns { overdueCount, dueTodayCount, items: [{leadId, companyName, nextFollowUpDate, daysOverdue, leadStatus, ...}] }
      axiosInstance.get(DASHBOARD_EXEC.TODAYS_TASKS).then(r => {
        const items = r.data?.data?.items ?? [];
        setTodaysTasks(items.map(i => ({
          id: i.leadId,
          leadId: i.leadId,
          leadName: i.companyName,
          dueTime: i.nextFollowUpDate,
          taskType: i.leadStatus,
          isOverdue: (i.daysOverdue ?? 0) > 0,
        })));
      }).catch(() => {}),
      // /exec/demos returns { scheduledCount, doneCount, totalDealValue, items: [{leadId, companyName, leadStatus, ...}] }
      axiosInstance.get(DASHBOARD_EXEC.UPCOMING_MEETINGS).then(r => {
        const items = r.data?.data?.items ?? [];
        setUpcomingMeetings(items.map(i => ({
          id: i.leadId,
          leadId: i.leadId,
          leadName: i.companyName,
          meetingTime: null,
          meetLink: null,
        })));
      }).catch(() => {}),
      // /exec/activities returns [{id, leadId, companyName, activityType, summary, performedAt}]
      axiosInstance.get(DASHBOARD_EXEC.RECENT_ACTIVITIES).then(r => {
        const items = r.data?.data ?? [];
        setRecentActivities(items.map(i => ({
          ...i,
          leadName: i.companyName,
          createdAt: i.performedAt,
        })));
      }).catch(() => {}),
      // /exec/target returns { targetValue, achievedValue, valueAchievementPercent, ... }
      axiosInstance.get(DASHBOARD_EXEC.MONTHLY_TARGET).then(r => {
        const t = r.data?.data;
        if (t) {
          setMonthlyTarget({
            ...t,
            targetAmount: t.targetValue,
            achievedAmount: t.achievedValue,
            percentComplete: t.valueAchievementPercent,
          });
        }
      }).catch(() => {}),
    ];
    Promise.all(promises).finally(() => {
      setLoading(false);
      setLastUpdated(new Date());
    });
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 300000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const getMinutesAgo = () => {
    if (!lastUpdated) return null;
    const diff = Math.floor((new Date() - lastUpdated) / 60000);
    if (diff < 1) return 'just now';
    return `${diff} min${diff !== 1 ? 's' : ''} ago`;
  };

  const pct = monthlyTarget?.percentComplete ?? 0;
  const targetColor = pct >= 80 ? '#3B6D11' : pct >= 50 ? '#BA7517' : '#A32D2D';

  const gradeChartData = leadsByGrade.map(item => ({
    name: item.grade,
    value: item.count,
  }));

  return (
    <PageWrapper title="My Dashboard">
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 0.5, color: '#1A1A18' }}>
          My Dashboard
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#5A5A56' }}>
          Your personal sales overview
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!loading && (
        <>
          {/* ROW 1 — Metric Cards */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                label="My Leads"
                value={summary?.totalLeads}
                icon={PeopleOutlined}
                color="#185FA5"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                label="New This Month"
                value={summary?.newThisMonth}
                icon={AddCircleOutlineOutlined}
                color="#3B6D11"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                label="Today's Follow-ups"
                value={summary?.todayFollowups}
                icon={EventNoteOutlined}
                color="#185FA5"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                label="Overdue Tasks"
                value={summary?.overdueTasks}
                icon={WarningAmberOutlined}
                color="#A32D2D"
                highlight={(summary?.overdueTasks ?? 0) > 0}
              />
            </Grid>
          </Grid>

          {/* ROW 2 — Charts */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Leads by Stage */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #E3E1DA', height: '100%' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    My Leads by Stage
                  </Typography>
                  {leadsByStage.length === 0 ? (
                    <EmptyState message="No stage data available" />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        layout="vertical"
                        data={leadsByStage}
                        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                      >
                        <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'DM Mono', fill: '#5A5A56' }} />
                        <YAxis
                          type="category"
                          dataKey="stage"
                          tick={{ fontSize: 10, fill: '#5A5A56' }}
                          width={100}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E3E1DA' }}
                          cursor={{ fill: '#F7F6F3' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#185FA5" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Leads by Grade */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #E3E1DA', height: '100%' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    My Leads by Grade
                  </Typography>
                  {gradeChartData.length === 0 ? (
                    <EmptyState message="No grade data available" />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={gradeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          dataKey="value"
                          nameKey="name"
                        >
                          {gradeChartData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={GRADE_COLORS[entry.name] ?? CHART_COLORS[0]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E3E1DA' }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ROW 3 — Tasks & Meetings */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Today's Follow-ups & Overdue Tasks */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #E3E1DA', height: '100%' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    Today's Follow-ups & Overdue Tasks
                  </Typography>
                  {todaysTasks.length === 0 ? (
                    <EmptyState message="No tasks for today" />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {todaysTasks.map((task) => (
                        <Box
                          key={task.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #E3E1DA',
                            background: task.isOverdue ? '#FFF5F5' : '#FAFAF8',
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#185FA5',
                                cursor: 'pointer',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                              onClick={() => navigate(`/leads/${task.leadId}`)}
                            >
                              {task.leadName}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: '#5A5A56', fontFamily: 'DM Mono' }}>
                              {task.dueTime ? formatDateTime(task.dueTime) : '—'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexShrink: 0, ml: 1 }}>
                            <Chip
                              label={task.taskType?.replace(/_/g, ' ')}
                              size="small"
                              sx={{ fontSize: 10, height: 20, fontWeight: 600 }}
                            />
                            {task.isOverdue && (
                              <Chip
                                label="Overdue"
                                size="small"
                                sx={{ fontSize: 10, height: 20, background: '#A32D2D15', color: '#A32D2D', fontWeight: 600 }}
                              />
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Meetings */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #E3E1DA', height: '100%' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    Upcoming Meetings
                  </Typography>
                  {upcomingMeetings.length === 0 ? (
                    <EmptyState message="No upcoming meetings" />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {upcomingMeetings.map((meeting) => (
                        <Box
                          key={meeting.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #E3E1DA',
                            background: '#FAFAF8',
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <VideocamOutlined sx={{ fontSize: 14, color: '#0F6E56' }} />
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: '#185FA5',
                                  cursor: 'pointer',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                                onClick={() => navigate(`/leads/${meeting.leadId}`)}
                              >
                                {meeting.leadName}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: 11, color: '#5A5A56', fontFamily: 'DM Mono', mt: 0.25 }}>
                              {meeting.meetingTime ? formatDateTime(meeting.meetingTime) : '—'}
                            </Typography>
                          </Box>
                          {meeting.meetLink && (
                            <Box
                              component="a"
                              href={meeting.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#0F6E56',
                                textDecoration: 'none',
                                border: '1px solid #0F6E56',
                                borderRadius: '6px',
                                px: 1.5,
                                py: 0.5,
                                flexShrink: 0,
                                ml: 1,
                                '&:hover': { background: '#0F6E5615' },
                              }}
                            >
                              Join Meet
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ROW 4 — Recent Activities & Monthly Target */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* Recent Activities */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #E3E1DA', height: '100%' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    Recent Activities
                  </Typography>
                  {recentActivities.length === 0 ? (
                    <EmptyState message="No recent activities" />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {recentActivities.slice(0, 10).map((activity, i) => {
                        const dotColor = ACTIVITY_COLORS[activity.activityType] ?? '#5A5A56';
                        return (
                          <Box key={activity.id ?? i} sx={{ display: 'flex', gap: 1.5 }}>
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
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'baseline' }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1A1A18' }}>
                                  {activity.activityType?.replace(/_/g, ' ')}
                                </Typography>
                                {activity.leadName && (
                                  <Typography
                                    sx={{
                                      fontSize: 12,
                                      color: '#185FA5',
                                      cursor: 'pointer',
                                      '&:hover': { textDecoration: 'underline' },
                                    }}
                                    onClick={() => activity.leadId && navigate(`/leads/${activity.leadId}`)}
                                  >
                                    · {activity.leadName}
                                  </Typography>
                                )}
                              </Box>
                              {activity.summary && (
                                <Typography
                                  sx={{
                                    fontSize: 11,
                                    color: '#5A5A56',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
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

            {/* Monthly Target vs Achievement */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid #E3E1DA', height: '100%' }}>
                <CardContent sx={{ p: '16px 20px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A5A56', mb: 2 }}>
                    Monthly Target vs Achievement
                  </Typography>
                  {!monthlyTarget ? (
                    <EmptyState message="No target data available" />
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                          <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                            Target
                          </Typography>
                          <Typography sx={{ fontSize: 20, fontWeight: 300, fontFamily: 'DM Mono', color: '#1A1A18' }}>
                            {formatINR(monthlyTarget.targetAmount)}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                            Achieved
                          </Typography>
                          <Typography sx={{ fontSize: 20, fontWeight: 300, fontFamily: 'DM Mono', color: targetColor }}>
                            {formatINR(monthlyTarget.achievedAmount)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>Progress</Typography>
                          <Typography sx={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 600, color: targetColor }}>
                            {Math.round(pct)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(pct, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#F0EEE9',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: targetColor,
                            },
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          p: '10px 14px',
                          borderRadius: '8px',
                          background: `${targetColor}10`,
                          border: `1px solid ${targetColor}30`,
                        }}
                      >
                        <Typography sx={{ fontSize: 12, color: targetColor, fontWeight: 500 }}>
                          {formatINR(monthlyTarget.achievedAmount)} of {formatINR(monthlyTarget.targetAmount)} achieved ({Math.round(pct)}%)
                        </Typography>
                        {pct >= 80 && (
                          <Typography sx={{ fontSize: 11, color: '#3B6D11', mt: 0.25 }}>
                            Excellent! You're on track to hit your target.
                          </Typography>
                        )}
                        {pct >= 50 && pct < 80 && (
                          <Typography sx={{ fontSize: 11, color: '#BA7517', mt: 0.25 }}>
                            Good progress — keep pushing!
                          </Typography>
                        )}
                        {pct < 50 && (
                          <Typography sx={{ fontSize: 11, color: '#A32D2D', mt: 0.25 }}>
                            You need to accelerate to meet your target.
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ mt: 3 }}>
                        <AccountBalanceWalletOutlined sx={{ fontSize: 13, color: '#5A5A56', mr: 0.5 }} />
                        <Typography component="span" sx={{ fontSize: 11, color: '#5A5A56' }}>
                          Remaining: {formatINR(Math.max(0, (monthlyTarget.targetAmount ?? 0) - (monthlyTarget.achievedAmount ?? 0)))}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Upcoming Demos */}
          <Box sx={{ mt: 2 }}>
            <UpcomingDemosWidget />
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 1, textAlign: 'right' }}>
            <Typography sx={{ fontSize: 11, color: '#5A5A56', fontFamily: 'DM Mono' }}>
              Last updated: {getMinutesAgo() ?? '—'}
            </Typography>
          </Box>
        </>
      )}
    </PageWrapper>
  );
}
