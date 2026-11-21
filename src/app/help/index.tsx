import { router, type Href } from 'expo-router';
import { CheckCircle2, ChevronRight, CircleHelp, ImagePlus, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FaqAccordion } from '@/components/help/faq-accordion';
import { TicketRow } from '@/components/help/ticket-row';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
import {
  searchFaqs,
  support,
  ticketCategories,
  topFaqs,
} from '@/config/help';
import { pickTicketScreenshots, deleteTicketScreenshot } from '@/lib/ticket-media';
import { useBookings } from '@/store/bookings';
import {
  createTicket,
  TICKET_MAX_SCREENSHOTS,
  TICKET_MESSAGE_MAX,
  TICKET_SUBJECT_MAX,
  useTickets,
  validateTicket,
  type TicketCategory,
  type TicketScreenshot,
} from '@/store/tickets';
import { base, colors, font, radius, shadow, space, text } from '@/theme';

/** P22 Help centre as a ticket centre: tiles, request form, recent tickets, FAQs (S1 16.3). */
export default function HelpCentreScreen() {
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const results = searchFaqs(query);
  const showingSearch = trimmedQuery.length > 0;

  const [category, setCategory] = useState<TicketCategory>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [screenshots, setScreenshots] = useState<TicketScreenshot[]>([]);
  const [touched, setTouched] = useState<{ subject?: boolean; message?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [screenshotNote, setScreenshotNote] = useState('');

  const tickets = useTickets();
  const bookings = useBookings();
  const recentBookingOptions = bookings.slice(0, 3);

  const errors = validateTicket({ category, subject, message });
  const showSubjectError = touched.subject ? errors.subject : undefined;
  const showMessageError = touched.message ? errors.message : undefined;
  const canSubmit = !errors.subject && !errors.message && !submitting;

  const addScreenshots = async () => {
    const remaining = TICKET_MAX_SCREENSHOTS - screenshots.length;
    if (remaining <= 0) return;
    const result = await pickTicketScreenshots(remaining);
    if (result.permission === 'denied' || result.permission === 'blocked') {
      setScreenshotNote('Allow photo access in your device settings to attach screenshots.');
      return;
    }
    if (result.permission === 'unsupported') {
      setScreenshotNote('Screenshots can be attached in the mobile app.');
      return;
    }
    setScreenshotNote('');
    setScreenshots((current) => [...current, ...result.shots].slice(0, TICKET_MAX_SCREENSHOTS));
  };

  const removeScreenshot = (shot: TicketScreenshot) => {
    deleteTicketScreenshot(shot);
    setScreenshots((current) => current.filter((item) => item.id !== shot.id));
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const ticket = createTicket({
      category,
      subject,
      message,
      bookingId: bookingCode.trim() || undefined,
      screenshots,
    });
    setConfirmation(
      `Ticket ${ticket.id} received. We reply within one business day.`,
    );
    setSubject('');
    setMessage('');
    setBookingCode('');
    setScreenshots([]);
    setTouched({});
    setSubmitting(false);
  };

  const callSupport = () => {
    if (support.phone) void Linking.openURL(support.phone.href);
  };
  const whatsappSupport = () => {
    if (support.whatsapp) void Linking.openURL(support.whatsapp.url(`Hi Gabfix, I need help with ${bookingCode || 'a booking'}.`));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Help centre" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            How can we help?
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            Search the answers customers ask for most, or send us a ticket.
          </Text>
        </View>

        <Input
          leftIcon={Search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search the FAQs"
          accessibilityLabel="Search the FAQs"
          returnKeyType="search"
        />

        {showingSearch ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                Search results
              </Text>
              <Text style={styles.resultCount} maxFontSizeMultiplier={1.2}>
                {results.length} {results.length === 1 ? 'answer' : 'answers'}
              </Text>
            </View>

            {results.length > 0 ? (
              <View style={styles.listCard}>
                {results.map((faq, index) => (
                  <FaqAccordion key={faq.id} faq={faq} last={index === results.length - 1} />
                ))}
              </View>
            ) : (
              <View style={[base.card, styles.noResults]}>
                <View style={styles.noResultsIcon}>
                  <CircleHelp size={26} color={colors.green700} strokeWidth={2} />
                </View>
                <Text style={styles.noResultsTitle} maxFontSizeMultiplier={1.3}>
                  No answers for “{trimmedQuery}”
                </Text>
                <Text style={styles.noResultsCaption} maxFontSizeMultiplier={1.3}>
                  Try a shorter word like “refund”, “price” or “cancel”, or send a ticket below.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                What do you need help with?
              </Text>
              <View style={styles.grid}>
                {ticketCategories.map((item) => {
                  const Icon = item.icon;
                  const selected = category === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${item.label}: ${item.blurb}`}
                      onPress={() => setCategory(item.value)}
                      style={[styles.tile, selected && styles.tileSelected]}>
                      <Icon
                        size={24}
                        color={selected ? colors.green700 : colors.textMuted}
                        strokeWidth={1.8}
                      />
                      <Text style={styles.tileLabel} maxFontSizeMultiplier={1.2}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                Submit a request
              </Text>
              {confirmation ? (
                <View style={[base.card, styles.confirmation]}>
                  <CheckCircle2 size={26} color={colors.green700} strokeWidth={2} />
                  <Text style={styles.confirmationText} maxFontSizeMultiplier={1.3}>
                    {confirmation}
                  </Text>
                  <Button
                    label="Send another ticket"
                    variant="secondary"
                    onPress={() => setConfirmation(null)}
                  />
                </View>
              ) : (
                <View style={[base.card, styles.form]}>
                  <Input
                    label="Subject"
                    value={subject}
                    onChangeText={setSubject}
                    onBlur={() => setTouched((current) => ({ ...current, subject: true }))}
                    placeholder="Briefly describe the issue"
                    maxLength={TICKET_SUBJECT_MAX}
                    error={showSubjectError}
                  />

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel} maxFontSizeMultiplier={1.2}>
                      Booking code (optional)
                    </Text>
                    {recentBookingOptions.length > 0 ? (
                      <View style={styles.bookingChips}>
                        {recentBookingOptions.map((booking) => (
                          <FilterChip
                            key={booking.id}
                            label={`${booking.id} · ${booking.serviceName}`}
                            selected={bookingCode === booking.id}
                            onPress={() =>
                              setBookingCode((current) => (current === booking.id ? '' : booking.id))
                            }
                          />
                        ))}
                      </View>
                    ) : null}
                    <Input
                      value={bookingCode}
                      onChangeText={setBookingCode}
                      placeholder="Or type a booking code"
                      autoCapitalize="characters"
                      maxLength={20}
                      accessibilityLabel="Booking code, optional"
                    />
                  </View>

                  <Input
                    label="Message"
                    value={message}
                    onChangeText={setMessage}
                    onBlur={() => setTouched((current) => ({ ...current, message: true }))}
                    placeholder="Share the details…"
                    multiline
                    numberOfLines={4}
                    maxLength={TICKET_MESSAGE_MAX}
                    inputStyle={styles.multiline}
                    error={showMessageError}
                    helper={
                      message.length > 800
                        ? `${message.length.toLocaleString('en-US')} / ${TICKET_MESSAGE_MAX.toLocaleString('en-US')} characters`
                        : undefined
                    }
                  />

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel} maxFontSizeMultiplier={1.2}>
                      Add screenshots
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Add screenshots"
                      onPress={addScreenshots}
                      style={styles.addShots}>
                      <ImagePlus size={20} color={colors.green700} strokeWidth={2} />
                      <Text style={styles.addShotsText} maxFontSizeMultiplier={1.2}>
                        Add up to {TICKET_MAX_SCREENSHOTS} images
                      </Text>
                    </Pressable>
                    {screenshotNote ? (
                      <Text style={styles.note} maxFontSizeMultiplier={1.3}>
                        {screenshotNote}
                      </Text>
                    ) : null}
                    {screenshots.length > 0 ? (
                      <View style={styles.thumbs}>
                        {screenshots.map((shot) => (
                          <View key={shot.id} style={styles.thumbWrap}>
                            <Image source={{ uri: shot.uri }} style={styles.thumb} />
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Remove screenshot"
                              hitSlop={8}
                              onPress={() => removeScreenshot(shot)}
                              style={styles.thumbRemove}>
                              <X size={12} color={colors.surface} strokeWidth={3} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.note} maxFontSizeMultiplier={1.3}>
                    For urgent booking or payment issues, call support during business hours.{' '}
                    {support.phone ? (
                      <Text style={styles.noteLink} onPress={callSupport}>
                        Call
                      </Text>
                    ) : null}
                    {support.phone && support.whatsapp ? ' · ' : null}
                    {support.whatsapp ? (
                      <Text style={styles.noteLink} onPress={whatsappSupport}>
                        WhatsApp
                      </Text>
                    ) : null}
                  </Text>

                  <Button
                    label="Submit ticket"
                    onPress={submit}
                    loading={submitting}
                    disabled={!canSubmit}
                  />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                  Recent tickets
                </Text>
                {tickets.length > 0 ? (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="View all tickets"
                    hitSlop={8}
                    onPress={() => router.push('/help/tickets' as Href)}
                    style={styles.link}>
                    <Text style={styles.linkText} maxFontSizeMultiplier={1.2}>
                      View all
                    </Text>
                    <ChevronRight size={14} color={colors.green700} strokeWidth={2} />
                  </Pressable>
                ) : null}
              </View>
              {tickets.length === 0 ? (
                <Text style={styles.emptyTickets} maxFontSizeMultiplier={1.3}>
                  No support tickets yet
                </Text>
              ) : (
                <View style={[base.card, styles.ticketCard]}>
                  {tickets.slice(0, 3).map((ticket, index) => (
                    <View key={ticket.id}>
                      {index > 0 ? <View style={styles.divider} /> : null}
                      <TicketRow
                        ticket={ticket}
                        onPress={() =>
                          router.push({
                            pathname: '/help/tickets/[id]',
                            params: { id: ticket.id },
                          } as Href)
                        }
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                  Common questions
                </Text>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="See all FAQs"
                  hitSlop={8}
                  onPress={() => router.push('/help/faq' as Href)}
                  style={styles.link}>
                  <Text style={styles.linkText} maxFontSizeMultiplier={1.2}>
                    See all
                  </Text>
                  <ChevronRight size={14} color={colors.green700} strokeWidth={2} />
                </Pressable>
              </View>
              <View style={styles.listCard}>
                {topFaqs.slice(0, 3).map((faq, index) => (
                  <FaqAccordion key={faq.id} faq={faq} last={index === 2} />
                ))}
              </View>
            </View>

            <Button
              label="Contact us"
              variant="secondary"
              onPress={() => router.push('/help/contact' as Href)}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[10], gap: space[5] },
  intro: { gap: space[2] },
  title: { ...text.h1 },
  subtitle: { ...text.body, color: colors.textMuted, lineHeight: 21 },
  section: { gap: space[3] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  sectionTitle: { ...text.h3 },
  resultCount: { ...text.caption },
  link: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  linkText: {
    ...text.caption,
    color: colors.green700,
    fontFamily: font.bodySemi,
  },
  listCard: { ...base.card, padding: 0, overflow: 'hidden' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: space[2],
  },
  tile: {
    width: '31.5%',
    height: 88,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...shadow.card,
  },
  tileSelected: { borderColor: colors.green500, backgroundColor: colors.green50 },
  tileLabel: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.text },
  form: { gap: space[4] },
  field: { gap: space[2] },
  fieldLabel: { ...text.caption, fontFamily: font.bodySemi, color: colors.textMuted, fontSize: 13 },
  bookingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  multiline: { minHeight: 104, textAlignVertical: 'top', paddingTop: space[3] },
  addShots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    minHeight: 52,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  addShotsText: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  thumbs: { flexDirection: 'row', gap: space[2] },
  thumbWrap: { width: 64, height: 64 },
  thumb: { width: 64, height: 64, borderRadius: radius.button, backgroundColor: colors.disabledBg },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { ...text.caption, lineHeight: 18 },
  noteLink: { color: colors.green700, fontFamily: font.bodySemi },
  confirmation: { alignItems: 'center', gap: space[2] },
  confirmationText: { ...text.bodyM, textAlign: 'center', fontFamily: font.bodySemi },
  ticketCard: { paddingVertical: space[1], paddingHorizontal: space[3] },
  divider: { height: 1, backgroundColor: colors.border },
  emptyTickets: { ...text.body, color: colors.textMuted },
  noResults: { alignItems: 'center', gap: space[2] },
  noResultsIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsTitle: { ...text.h3, textAlign: 'center' },
  noResultsCaption: { ...text.caption, textAlign: 'center', lineHeight: 19 },
});
