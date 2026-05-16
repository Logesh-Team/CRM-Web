import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Card, CardContent, Typography, Button, CircularProgress, Chip,
} from '@mui/material';
import { ArrowBackOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { fetchDemoById } from '../../features/demos/demosSlice';
import PageWrapper from '../../components/common/PageWrapper';
import { formatDateTime } from '../../utils/formatDate';

const STATUS_COLORS = {
  SCHEDULED: { bg: '#E6F1FB', text: '#185FA5' },
  COMPLETED:  { bg: '#EAF3DE', text: '#3B6D11' },
  CANCELLED:  { bg: '#FCEBEB', text: '#A32D2D' },
  NO_SHOW:    { bg: '#FAEEDA', text: '#BA7517' },
};

const PLATFORM_LABELS = {
  GOOGLE_MEET: 'Google Meet', ZOOM: 'Zoom',
  IN_PERSON: 'In Person', OTHER: 'Other',
};

function Field({ label, value, mono, link }) {
  if (!value) return null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#5A5A56', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
        {label}
      </Typography>
      {link ? (
        <Typography component="a" href={value} target="_blank" rel="noopener noreferrer"
          sx={{ fontSize: 13, color: '#185FA5', display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none' }}>
          {value} <OpenInNewOutlined sx={{ fontSize: 12 }} />
        </Typography>
      ) : (
        <Typography sx={{ fontSize: 13, color: '#1A1A18', fontFamily: mono ? 'DM Mono' : 'DM Sans' }}>
          {value}
        </Typography>
      )}
    </Box>
  );
}

export default function DemoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedDemo: demo, loading } = useSelector(s => s.demos);

  useEffect(() => {
    if (id) dispatch(fetchDemoById(id));
  }, [id, dispatch]);

  if (loading || !demo) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <CircularProgress />
    </Box>
  );

  const sc = STATUS_COLORS[demo.status] || STATUS_COLORS.SCHEDULED;

  return (
    <PageWrapper
      title={demo.title}
      breadcrumbs={[
        { label: 'Demos', path: '/demos' },
        ...(demo.leadCompanyName ? [{ label: demo.leadCompanyName, path: `/leads/${demo.leadId}` }] : []),
        { label: demo.title },
      ]}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{demo.title}</Typography>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 999,
            background: sc.bg, color: sc.text,
          }}>
            {demo.status}
          </span>
        </Box>
        <Button variant="outlined" size="small" startIcon={<ArrowBackOutlined />}
          onClick={() => navigate(-1)}
          sx={{ fontSize: 12, borderColor: '#E3E1DA', color: '#5A5A56' }}>
          Back
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 280, border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
          <CardContent sx={{ p: '20px 24px' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2 }}>Demo Details</Typography>
            <Field label="Lead / Company" value={demo.leadCompanyName} />
            <Field label="Scheduled" value={formatDateTime(demo.scheduledAt)} />
            <Field label="Duration" value={`${demo.durationMinutes} minutes`} />
            <Field label="Platform" value={PLATFORM_LABELS[demo.platform] || demo.platform} />
            {demo.meetLink && <Field label="Meet Link" value={demo.meetLink} link />}
            {demo.location && <Field label="Location" value={demo.location} />}
            <Field label="Demo Presenter" value={demo.assignedToName} />
            <Field label="Scheduled By" value={demo.scheduledByName} />
            {demo.notes && <Field label="Notes" value={demo.notes} />}
          </CardContent>
        </Card>

        {demo.agendaItems?.length > 0 && (
          <Card sx={{ flex: 1, minWidth: 250, border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
            <CardContent sx={{ p: '20px 24px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2 }}>Agenda</Typography>
              {demo.agendaItems.map((a, i) => (
                <Box key={a.id || i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{
                    width: 16, height: 16, borderRadius: 2, border: '1.5px solid',
                    borderColor: a.done ? '#3B6D11' : '#E3E1DA',
                    background: a.done ? '#3B6D11' : 'transparent',
                    flexShrink: 0, mt: 0.25,
                  }} />
                  <Typography sx={{ fontSize: 13, color: a.done ? '#5A5A56' : '#1A1A18',
                    textDecoration: a.done ? 'line-through' : 'none' }}>
                    {a.title}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {demo.participants?.length > 0 && (
          <Card sx={{ flex: 1, minWidth: 250, border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
            <CardContent sx={{ p: '20px 24px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2 }}>Participants</Typography>
              {demo.participants.map((p, i) => (
                <Box key={p.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%', background: '#E6F1FB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#185FA5',
                  }}>
                    {(p.name || p.email || '?')[0].toUpperCase()}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{p.name || p.email}</Typography>
                    {p.email && p.name && <Typography sx={{ fontSize: 11, color: '#5A5A56' }}>{p.email}</Typography>}
                  </Box>
                  <Chip label={p.role} size="small" sx={{ ml: 'auto', fontSize: 10 }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {(demo.outcome || demo.postDemoNotes) && (
          <Card sx={{ width: '100%', border: '1px solid #E3E1DA', borderRadius: '10px', boxShadow: 'none' }}>
            <CardContent sx={{ p: '20px 24px' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2 }}>Post-Demo</Typography>
              <Field label="Outcome" value={demo.outcome} />
              <Field label="Notes" value={demo.postDemoNotes} />
            </CardContent>
          </Card>
        )}
      </Box>
    </PageWrapper>
  );
}
