import React, { useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, CircularProgress } from '@mui/material';
import { VideocamOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUpcomingDemos, openDemoDialog } from '../../features/demos/demosSlice';
import EventDialog from '../../pages/EventDialog';

const PLATFORM_ICONS = {
  GOOGLE_MEET: '📹',
  ZOOM: '📱',
  IN_PERSON: '🏢',
  OTHER: '📅',
};

export default function UpcomingDemosWidget() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { upcomingDemos, loading } = useSelector(s => s.demos);

  useEffect(() => {
    dispatch(fetchUpcomingDemos());
  }, [dispatch]);

  const formatTime = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <>
      <Card sx={{ border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
        <CardContent sx={{ p: '16px 20px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VideocamOutlined sx={{ fontSize: 16, color: '#185FA5' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Upcoming Demos</Typography>
            </Box>
            <Button size="small" endIcon={<OpenInNewOutlined sx={{ fontSize: 12 }} />}
              onClick={() => navigate('/demos')}
              sx={{ fontSize: 11, color: '#185FA5', p: 0, minWidth: 0 }}>
              View all
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : upcomingDemos.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: '#5A5A56', textAlign: 'center', py: 2 }}>
              No upcoming demos
            </Typography>
          ) : (
            upcomingDemos.slice(0, 5).map(d => (
              <Box key={d.id}
                onClick={() => dispatch(openDemoDialog(d))}
                sx={{
                  display: 'flex', gap: 1.5, alignItems: 'flex-start',
                  p: '8px 10px', mb: 0.5, borderRadius: '8px',
                  border: '1px solid #F0EEE9', cursor: 'pointer',
                  '&:hover': { background: '#F7F6F3', borderColor: '#E3E1DA' },
                }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '8px',
                  background: '#E6F1FB', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, flexShrink: 0,
                }}>
                  {PLATFORM_ICONS[d.platform] || '📅'}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1A1A18',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.title}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>
                    {d.leadCompanyName && `${d.leadCompanyName} · `}{formatTime(d.scheduledAt)}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 10, color: '#5A5A56', flexShrink: 0 }}>
                  {d.durationMinutes}m
                </Typography>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
      <EventDialog />
    </>
  );
}
