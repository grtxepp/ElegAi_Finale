import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Loading, EmptyState, ErrorBox, Title, StatusBadge, PrimaryButton } from '../components';
import api, { errMsg } from '../api';
import { C, DISPLAY, card } from '../theme';
import { formatDateTime } from '../utils';

const FLOW = [
  { key: 'New', label: 'Submitted' },
  { key: 'In Review', label: 'In review' },
  { key: 'Fulfilled', label: 'Fulfilled' },
];

function Progress({ status }) {
  if (status === 'Declined') {
    return (
      <View style={styles.declinedBox}>
        <Ionicons name="close-circle-outline" size={16} color="#B91C1C" />
        <Text style={styles.declinedText}>
          This request was declined. Contact the boutique if you need more details.
        </Text>
      </View>
    );
  }

  const index = Math.max(0, FLOW.findIndex((step) => step.key === status));

  return (
    <View style={styles.progressRow}>
      {FLOW.map((step, i) => (
        <React.Fragment key={step.key}>
          {i > 0 && <View style={[styles.progressLine, i <= index && { backgroundColor: C.gold }]} />}
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, i <= index ? { backgroundColor: C.gold } : null]}>
              {i < index ? (
                <Ionicons name="checkmark" size={12} color={C.white} />
              ) : (
                <Text style={[styles.progressNum, i <= index && { color: C.white }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.progressLabel, i <= index && { color: C.charcoal, fontWeight: '700' }]}>
              {step.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

export default function RequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/look-requests');
      setRequests(data.requests);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Title>My style requests</Title>
          <Text style={styles.intro}>Track each look you sent to the boutique and read stylist updates.</Text>
        </View>
        <Pressable onPress={load} hitSlop={8} style={styles.refreshBtn} disabled={loading}>
          <Ionicons name="refresh" size={18} color={C.goldDark} />
        </Pressable>
      </View>

      {error ? (
        <View style={{ marginTop: 20 }}>
          <ErrorBox message={error} />
          <PrimaryButton title="Try again" onPress={load} />
        </View>
      ) : loading ? (
        <Loading />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="sparkles-outline"
          title="No style requests yet"
          message="Send a generated look to the boutique from the AI Stylist, then follow its progress here."
          action={
            <Pressable
              onPress={() => navigation.navigate('Stylist')}
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="sparkles-outline" size={15} color={C.white} />
              <Text style={styles.ctaText}>Open AI Stylist</Text>
            </Pressable>
          }
        />
      ) : (
        <View style={{ marginTop: 18 }}>
          {requests.map((r) => (
            <View key={r.request_id} style={[card, styles.requestCard]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={styles.requestId}>Request #{r.request_id}</Text>
                    <StatusBadge status={r.status} />
                  </View>
                  <Text style={styles.meta}>Sent {formatDateTime(r.created_at)}</Text>
                </View>
                {(r.admin_note || r.status !== 'New') && r.updated_at ? (
                  <Text style={styles.updated}>Updated {formatDateTime(r.updated_at)}</Text>
                ) : null}
              </View>

              <View style={styles.body}>
                <View style={styles.thumb}>
                  {r.image_data ? (
                    <Image source={{ uri: r.image_data }} style={styles.thumbImage} />
                  ) : (
                    <Ionicons name="image-outline" size={24} color={C.grayLight} />
                  )}
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  {r.prompt ? <Text style={styles.prompt}>{r.prompt}</Text> : null}
                  {r.sizing ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="resize-outline" size={14} color={C.goldDark} />
                      <Text style={styles.metaStrong}>Size: {r.sizing}</Text>
                    </View>
                  ) : null}
                  {r.measurements ? (
                    <Text style={styles.detail}><Text style={styles.metaStrong}>Measurements: </Text>{r.measurements}</Text>
                  ) : null}
                  {r.notes ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color={C.goldDark} />
                      <Text style={styles.detail}>{r.notes}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.progressWrap}>
                <Progress status={r.status} />
              </View>

              {r.admin_note ? (
                <View style={styles.noteBox}>
                  <View style={styles.metaRow}>
                    <Ionicons name="chatbubble-ellipses" size={13} color={C.goldDark} />
                    <Text style={styles.noteTitle}>Update from the boutique</Text>
                  </View>
                  <Text style={styles.noteText}>{r.admin_note}</Text>
                </View>
              ) : r.status === 'New' ? (
                <Text style={styles.waiting}>We have your request. Updates from the boutique will appear here.</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6 },
  intro: { color: C.gray, fontSize: 14, lineHeight: 21, marginTop: 8 },
  refreshBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  requestCard: { marginBottom: 14, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  requestId: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', color: C.charcoal },
  meta: { color: C.gray, fontSize: 12, marginTop: 4 },
  updated: { color: C.grayLight, fontSize: 11, textAlign: 'right', maxWidth: 120 },
  body: { flexDirection: 'row', gap: 12, marginTop: 12 },
  thumb: { width: 96, height: 110, borderRadius: 12, backgroundColor: C.ivory, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  prompt: { color: C.gray, fontSize: 13, lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  metaStrong: { color: C.charcoal, fontSize: 13, fontWeight: '700' },
  detail: { color: C.gray, fontSize: 13, lineHeight: 19, flex: 1 },
  progressWrap: { borderTopWidth: 1, borderTopColor: 'rgba(31,31,31,0.08)', marginTop: 14, paddingTop: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  progressLine: { flex: 1, height: 2, backgroundColor: 'rgba(31,31,31,0.1)', marginTop: 11 },
  progressStep: { width: 74, alignItems: 'center', gap: 5 },
  progressDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.ivory, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(31,31,31,0.1)' },
  progressNum: { fontSize: 10, fontWeight: '700', color: C.gray },
  progressLabel: { fontSize: 10, color: C.grayLight, textAlign: 'center' },
  declinedBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10 },
  declinedText: { flex: 1, color: '#B91C1C', fontSize: 12, lineHeight: 18 },
  noteBox: { marginTop: 12, backgroundColor: 'rgba(201,162,39,0.08)', borderWidth: 1, borderColor: 'rgba(201,162,39,0.3)', borderRadius: 12, padding: 12 },
  noteTitle: { color: C.goldDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  noteText: { color: C.charcoal, fontSize: 13, lineHeight: 19, marginTop: 6 },
  waiting: { color: C.grayLight, fontSize: 12, marginTop: 12, lineHeight: 18 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.charcoal, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11, marginTop: 16 },
  ctaText: { color: C.white, fontSize: 13, fontWeight: '700' },
});
