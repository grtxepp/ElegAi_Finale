import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Field, PrimaryButton, GhostButton, ChipRow, ErrorBox } from '../components';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { C, DISPLAY, card } from '../theme';

const GREETING = {
  role: 'assistant',
  content:
    "Hello! I'm ElegAI, your styling assistant. Tell me the occasion, colours and style you love. I can answer sizing, delivery and returns questions, or draw a look for you.",
};

const STARTERS = [
  'I need an outfit for a wedding',
  'What colours do you have in stock?',
  'How does your sizing work?',
  'Draw me an elegant evening look',
];

const OCCASIONS = ['Wedding', 'Cocktail Party', 'Gala / Formal Ball', 'Corporate Event', 'Graduation', 'Debut / Quinceañera', 'Engagement', 'Garden Party'];
const STYLES = ['Elegant', 'Classic', 'Modern', 'Romantic', 'Vintage', 'Minimalist', 'Bold / Statement', 'Traditional'];
const COLORS = ['Ivory', 'White', 'Gold', 'Black', 'Navy', 'Red', 'Green', 'Pink', 'Champagne', 'Charcoal', 'Gray'];
const FITS = ['A-Line', 'Mermaid', 'Ball Gown', 'Sheath', 'Fit & Flare', 'Slim Fit', 'Tailored', 'Relaxed Fit'];

export default function StylistChatScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([GREETING]);
  const [draft, setDraft] = useState('');
  const [provider, setProvider] = useState('');
  const [chips, setChips] = useState([]);
  const [chatting, setChatting] = useState(false);
  const [chatError, setChatError] = useState('');

  const [brief, setBrief] = useState({ occasion: '', style: '', color: '', fit: '' });
  const [showBrief, setShowBrief] = useState(false);
  const [image, setImage] = useState(null);
  const [imaging, setImaging] = useState(false);
  const [imageError, setImageError] = useState('');

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ sizing: '', measurements: '', notes: '' });
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestDone, setRequestDone] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(timer);
  }, [messages, chatting, imaging, image, requestOpen, requestDone]);

  const ask = useCallback(
    async (text) => {
      const message = String(text || '').trim();
      if (!message || chatting) return;

      const history = messages
        .filter((m) => m.content && m !== GREETING)
        .slice(-10)
        .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      setMessages((prev) => [...prev, { role: 'user', content: message }]);
      setDraft('');
      setChatError('');
      setChatting(true);

      try {
        const { data } = await api.post('/chatbot/message', { message, history });
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        setProvider(data.provider || '');
        setChips(data.suggestions || []);
      } catch (error) {
        setChatError(errMsg(error, 'The assistant could not respond. Please try again.'));
      } finally {
        setChatting(false);
      }
    },
    [messages, chatting]
  );

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content;

  const generateImage = async () => {
    if (imaging) return;
    const request =
      draft.trim() ||
      lastUserMessage ||
      'an elegant formal outfit for a wedding, ivory A-line silhouette, classic and romantic';

    setImaging(true);
    setImageError('');
    setRequestOpen(false);
    setRequestDone(false);
    setRequestError('');

    try {
      const { data } = await api.post(
        '/chatbot/generate-image',
        { request, preferences: brief },
        { timeout: 210000 }
      );
      setImage({ src: data.image, prompt: data.prompt, source: data.source, request });
      if (!messages.some((m) => m.role === 'user')) {
        setMessages((prev) => [...prev, { role: 'user', content: request }]);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Here is a look based on ${brief.occasion ? `your ${brief.occasion.toLowerCase()} brief` : 'your request'}. You can send it to the boutique with your sizing below.`,
        },
      ]);
    } catch (error) {
      setImageError(errMsg(error, 'Image generation is unavailable right now.'));
    } finally {
      setImaging(false);
    }
  };

  const submitRequest = async () => {
    if (!image || requesting) return;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to send this look to the boutique.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    setRequesting(true);
    setRequestError('');
    try {
      await api.post('/chatbot/look-request', {
        prompt: image.prompt,
        source: image.source,
        image: image.src,
        sizing: requestForm.sizing,
        measurements: requestForm.measurements,
        notes: requestForm.notes,
      });
      setRequestDone(true);
      setRequestOpen(false);
      setRequestForm({ sizing: '', measurements: '', notes: '' });
    } catch (error) {
      setRequestError(errMsg(error, 'Could not send your request. Please try again.'));
    } finally {
      setRequesting(false);
    }
  };

  const resetChat = () => {
    setMessages([GREETING]);
    setChips([]);
    setProvider('');
    setChatError('');
    setDraft('');
  };

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <View style={styles.brandIcon}>
            <Ionicons name="sparkles" size={16} color={C.goldDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>ElegAI Stylist</Text>
            <Text style={styles.provider}>
              {provider ? `Powered by ${provider}` : 'Online - replies instantly'}
            </Text>
          </View>
          <Pressable onPress={resetChat} hitSlop={10} style={styles.headerBtn}>
            <Ionicons name="refresh" size={18} color={C.gray} />
          </Pressable>
          <Pressable onPress={() => setShowBrief((v) => !v)} hitSlop={10} style={styles.headerBtn}>
            <Ionicons name={showBrief ? 'options' : 'options-outline'} size={18} color={C.charcoal} />
          </Pressable>
        </View>

        {showBrief && (
          <View style={styles.briefCard}>
            <Text style={styles.briefTitle}>Styling brief</Text>
            <Text style={styles.briefLabel}>Occasion</Text>
            <ChipRow options={OCCASIONS} value={brief.occasion} onChange={(v) => setBrief((b) => ({ ...b, occasion: v }))} />
            <Text style={styles.briefLabel}>Style</Text>
            <ChipRow options={STYLES} value={brief.style} onChange={(v) => setBrief((b) => ({ ...b, style: v }))} />
            <Text style={styles.briefLabel}>Colour</Text>
            <ChipRow options={COLORS} value={brief.color} onChange={(v) => setBrief((b) => ({ ...b, color: v }))} />
            <Text style={styles.briefLabel}>Fit</Text>
            <ChipRow options={FITS} value={brief.fit} onChange={(v) => setBrief((b) => ({ ...b, fit: v }))} />
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <View
              key={`${message.role}-${index}`}
              style={[styles.messageRow, message.role === 'user' && { justifyContent: 'flex-end' }]}
            >
              {message.role === 'assistant' && (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>E</Text>
                </View>
              )}
              <View style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                <Text style={[styles.bubbleText, message.role === 'user' && { color: C.white }]}>
                  {message.content}
                </Text>
              </View>
            </View>
          ))}

          {chatting && (
            <View style={styles.messageRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>E</Text>
              </View>
              <View style={styles.assistantBubble}>
                <ActivityIndicator size="small" color={C.goldDark} />
              </View>
            </View>
          )}

          {messages.length === 1 && !chatting && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.starterLabel}>Try asking</Text>
              {STARTERS.map((starter) => (
                <Pressable
                  key={starter}
                  onPress={() => ask(starter)}
                  style={({ pressed }) => [styles.starter, pressed && { opacity: 0.75 }]}
                >
                  <Ionicons name="sparkles-outline" size={14} color={C.goldDark} />
                  <Text style={styles.starterText}>{starter}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {imageError ? <View style={{ marginTop: 10 }}><ErrorBox message={imageError} /></View> : null}

          {image && (
            <View style={[card, { marginTop: 14 }]}>
              <Image source={{ uri: image.src }} style={styles.resultImage} resizeMode="cover" />
              <Text style={styles.resultPrompt}>{image.prompt}</Text>
              <GhostButton
                title="Browse matching pieces"
                onPress={() => navigation.navigate('Catalog', {
                  category: brief.occasion === 'Wedding' ? 'Bridal Gowns' : 'Formal Dresses',
                })}
              />

              {requestDone ? (
                <View style={styles.doneBox}>
                  <Text style={styles.doneTitle}>Request sent</Text>
                  <Text style={styles.doneText}>
                    The boutique has your look request and will reach out with updates.
                  </Text>
                  <Pressable
                    onPress={() => navigation.navigate('Requests')}
                    style={({ pressed }) => [styles.trackBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="clipboard-outline" size={15} color={C.white} />
                    <Text style={styles.trackText}>Track this request</Text>
                  </Pressable>
                </View>
              ) : requestOpen ? (
                <View style={{ marginTop: 12 }}>
                  <Field
                    label="Sizing"
                    value={requestForm.sizing}
                    onChangeText={(v) => setRequestForm((f) => ({ ...f, sizing: v }))}
                    placeholder="e.g. M, or bust/waist/hips"
                  />
                  <Field
                    label="Measurements"
                    value={requestForm.measurements}
                    onChangeText={(v) => setRequestForm((f) => ({ ...f, measurements: v }))}
                    placeholder="e.g. bust 88, waist 66, hips 92"
                    multiline
                  />
                  <Field
                    label="Notes"
                    value={requestForm.notes}
                    onChangeText={(v) => setRequestForm((f) => ({ ...f, notes: v }))}
                    placeholder="Event date, fabric preference, questions"
                    multiline
                  />
                  {requestError ? <ErrorBox message={requestError} /> : null}
                  <PrimaryButton
                    title={requesting ? 'Sending...' : 'Send request to boutique'}
                    onPress={submitRequest}
                    loading={requesting}
                  />
                  <Pressable onPress={() => setRequestOpen(false)} style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <Text style={{ color: C.gray, fontSize: 13 }}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setRequestOpen(true)}
                  style={({ pressed }) => [styles.requestBtn, pressed && { opacity: 0.85 }]}
                >
                  <Ionicons name="paper-plane-outline" size={16} color={C.white} />
                  <Text style={styles.requestText}>Request this look</Text>
                </Pressable>
              )}
            </View>
          )}

          {chips.length > 0 && !chatting && (
            <View style={styles.suggestions}>
              {chips.map((chip) => (
                <Pressable
                  key={chip}
                  onPress={() => ask(chip)}
                  style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.75 }]}
                >
                  <Text style={styles.suggestionText}>{chip}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {chatError ? <View style={{ marginTop: 10 }}><ErrorBox message={chatError} /></View> : null}
        </ScrollView>

        <View style={styles.imageBar}>
          <Pressable
            onPress={generateImage}
            disabled={imaging}
            style={({ pressed }) => [styles.imageBtn, (imaging || pressed) && { opacity: 0.7 }]}
          >
            {imaging ? (
              <ActivityIndicator size="small" color={C.charcoal} />
            ) : (
              <Ionicons name="image-outline" size={16} color={C.charcoal} />
            )}
            <Text style={styles.imageBtnText}>{imaging ? 'Drawing...' : 'Draw this look'}</Text>
          </Pressable>
        </View>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask about an occasion, colour, size..."
            placeholderTextColor={C.grayLight}
            maxLength={1000}
            editable={!chatting}
            multiline
          />
          <Pressable
            onPress={() => ask(draft)}
            disabled={!draft.trim() || chatting}
            style={({ pressed }) => [
              styles.sendBtn,
              (!draft.trim() || chatting) && { opacity: 0.5 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="send" size={17} color={C.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 10 },
  brandIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(201,162,39,0.15)', alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '700', color: C.charcoal },
  provider: { color: C.grayLight, fontSize: 11, marginTop: 1 },
  headerBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  briefCard: { backgroundColor: C.white, borderRadius: 14, padding: 12, marginBottom: 10 },
  briefTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', color: C.charcoal, marginBottom: 6 },
  briefLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.gray, marginTop: 8, marginBottom: 6 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.charcoal, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  avatarText: { color: C.gold, fontSize: 10, fontWeight: '800' },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 },
  assistantBubble: { backgroundColor: C.white, borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: C.gold, borderTopRightRadius: 4 },
  bubbleText: { color: C.charcoal, fontSize: 14, lineHeight: 20 },
  starterLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.gray, marginBottom: 6 },
  starter: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, marginBottom: 7 },
  starterText: { color: C.charcoal, fontSize: 13 },
  resultImage: { width: '100%', aspectRatio: 1, borderRadius: 14, backgroundColor: C.ivoryDark },
  resultPrompt: { color: C.gray, fontSize: 12, lineHeight: 18, marginTop: 8 },
  requestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.gold, borderRadius: 999, paddingVertical: 12, marginTop: 12 },
  requestText: { color: C.white, fontSize: 13, fontWeight: '700' },
  doneBox: { backgroundColor: C.successBg, borderRadius: 12, padding: 12, marginTop: 12 },
  doneTitle: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700', color: '#047857' },
  doneText: { color: '#047857', fontSize: 13, lineHeight: 19, marginTop: 4 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.charcoal, borderRadius: 999, paddingVertical: 10, marginTop: 10 },
  trackText: { color: C.white, fontSize: 13, fontWeight: '700' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  suggestion: { backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  suggestionText: { color: C.charcoal, fontSize: 12 },
  imageBar: { paddingVertical: 8 },
  imageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.white, borderRadius: 999, paddingVertical: 11 },
  imageBtnText: { color: C.charcoal, fontSize: 13, fontWeight: '700' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(31,31,31,0.08)' },
  input: { flex: 1, backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(31,31,31,0.12)', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.charcoal, maxHeight: 110 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
});
