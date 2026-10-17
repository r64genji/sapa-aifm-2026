# Sapa AI use contract

This contract says what the AI in Sapa may do alone, what a person must approve, and what nobody may do. It applies to HR, managers, new hires and the team that runs Sapa. Rule IDs (R1, R2 …) point to "Product rules" in [05](05-implementation-spec.md). If this contract and a rule disagree, the stricter one applies.

## 1. What the AI is for

The AI reads new hires' check-in replies and questions. It helps HR find shared problems sooner and act on them. It does not judge people. Every decision about a person is made by a person.

## 2. Four levels of control

### Level 1: the AI does it alone

| Action | Limit |
| --- | --- |
| Label a reply with a problem area (role clarity, manager support, belonging, onboarding and training, workload) | It must quote the exact words it used. If the quote is not in the reply, the label waits for HR (R15). |
| Count a label it is sure about | Labels the AI is unsure about wait for HR and stay out of counts. Every count comes from SQL, not the AI (R18). |
| Write a short summary of counts | It is rejected if it holds a number that is not in its input (R18). |
| Draft a suggested fix | Nobody sees it until HR opens it, and nothing happens until HR approves it. |
| Answer a new hire's handbook question | Only from a page HR published. The answer is labelled "AI answer" and quotes the page (R31). |
| Show a new hire the AI's reading of their own replies (`/myanswers`) | Only that person sees it. It is labelled as AI and has a "This is wrong" button (R40). |
| Ask a new hire up to 2 follow-up questions in a check-in chat, after the fixed first question | One short, neutral question about work each time. No feelings, causes, names, advice or promises; code blocks feelings words and name or contact requests. The keyword check runs before the AI on every message, and the chat stops at once on a serious concern. The AI writes no summary for the new hire and there is no "what I will tell HR" step. HR sees the person's own words as one reply with a label and an exact quote (R12, R55, R56). |
| Rewrite a new hire's own message as clear, polite English when they ask with `/say` | Labelled "AI suggestion. Check it before you send:". The new hire copies and sends it themselves. Sapa stores nothing and HR never sees it. The keyword check runs first; a hit gets the Speak Up message and no rewrite. The AI adds no facts, names, promises or advice (R57). |
| Translate a Chinese reply for HR | Labelled "AI translation". It is never stored, counted or shown to anyone else (R53). |
| Flag a reply as a serious concern | See section 3. |

### Level 2: fixed text, approved once, then sent automatically

A named person checks each text in each language before it goes live (R46). After that, Sapa sends it without asking again.

- Check-in questions with their word buttons, the fixed first chat question, the light question and the "please ask HR" line (R55).
- The safe reply with helpline numbers (R14).
- The neutral recheck question (R26) and the fix follow-up question "Since the last Update from HR, how has this changed for you?" (R56).
- Manager milestone nudges (R45).
- The contact-choice buttons (section 4).

### Level 3: a person approves each time

| Action | Who approves |
| --- | --- |
| A label the AI is unsure about | HR |
| Any change to a label | HR, with an audit row (R25) |
| A fix: its text, scope and owner | HR |
| An "Update from HR" note to new hires | HR, who sees it as new hires will (R28) |
| The private-chat offer to one person | HR (R39) |
| The closure message after a serious concern | HR (R29) |
| Accepting and finishing a fix | The manager it is assigned to |

### Level 4: never, even with approval

- The AI writes free text to an employee. The only exceptions are the check-in follow-up questions (R12, R55), the handbook answer, `/myanswers` and the `/say` rewrite (R11, R57). The AI never writes the employee a summary of their chat.
- The AI scores a person, rates sentiment or personality, reads emotions, or predicts who will quit (R16).
- The AI closes, downgrades or hides a serious concern.
- A manager sees the words of a person who chose "HR only", or sees any serious concern (R7).
- A count is shown for fewer than 5 people (R8), or fewer than 3 in a manager view (R9).
- Teams or managers are ranked side by side (R51).
- The AI answers a question about harassment, safety, crisis, pay problems, probation or dismissal, health or legal matters. It gives the right human contact instead (R32).

## 3. Serious concerns

Serious concerns are harassment, sexual harassment, discrimination, bullying or threats, self-harm or crisis, safety hazards, wage or legal problems, and signs of forced labour.

**Automatic, at once, with no person in the loop:**

1. A keyword match or the AI's flag escalates the reply. Either one alone is enough. The keyword check still runs when the AI is down (R13).
2. The bot sends the fixed safe reply with helpline numbers. For forced labour and sexual harassment, the reply also names an outside authority that HR cannot remove (R14).
3. The bot asks the person if HR can contact them (section 4).
4. HR is alerted.
5. The bot asks no follow-up questions (R12).
6. The reply leaves all counts and themes, and managers cannot see it (R7).

**Only a person does these:**

1. Read the case.
2. Acknowledge it within 1 working day.
3. Contact the person, or record that they asked not to be contacted.
4. Record the outcome.
5. Close the case and, if allowed, send the fixed closure message (R29).

The AI writes no summary and drafts no fix for a serious concern. If HR finds it was a false alarm, HR closes it as "Not serious" with a note, and the record stays.

## 4. How HR contacts a person

Sapa opens the door. The talk happens by phone or in person, not in the bot.

1. After the safe reply, or after a "Yes" to the private-chat offer, the bot shows **[Yes, HR can contact me] [Not now]**.
2. On "Yes", the bot shows **[Call me] [Meet HR in person]**. "Call me" uses Telegram's share-phone-number button. The person chooses to send their number.
3. HR sees the choice on the case. HR calls or meets the person, then clicks **Called** or **Met**.
4. On "Not now", HR records the outcome without contact. For some matters HR may still need to follow up, and the bot tells the person this honestly.

The phone number goes only to HR. It never goes to the AI or the manager. HR never writes free text to the person through Sapa.

## 5. What the AI sees

- NRIC numbers, phone numbers and email addresses are masked before any text leaves Sapa (R17).
- Replies are sent to the AI as data, not as instructions. The AI has no tools.
- Summaries use only counts and short masked summaries, never raw replies.
- The AI never sees names. HR adds each new hire with a code name.

## 6. What a new hire can always do

These work even when the AI is down (R2):

- Skip a check-in, or stop all check-ins (R3).
- Delete everything (R4).
- Choose who may read their words: HR only (the default), or HR and their manager.
- See the AI's reading of their own replies and mark it wrong. A challenged label leaves the counts until HR reviews it (R40).
- Ask for a person instead of the bot.

## 7. When the AI fails

| Failure | What happens |
| --- | --- |
| The AI is down or slow | Commands and the keyword safety check still work. Replies wait as "needs review". |
| The AI gives a label with no real quote | The label waits for HR (R15). |
| The AI puts a made-up number in a summary | The summary is rejected and retried once (R18). |
| The AI misses a serious concern | The keyword check is a second line of defence. HR can flag any reply for follow-up by hand. |
| The AI flags a false alarm | HR closes it as "Not serious" with a note. |

## 8. Accountability

- Every read of reply text and every change to labels, fixes, consents, settings and roles writes an audit row with who, when and what (R25).
- Every AI output on the dashboard shows "AI — not reviewed" or "Reviewed by <name>".
- A panel shows how often HR changes the AI's labels and how often new hires mark them wrong, per problem area and language (R44).
- HR owns every decision. The AI only suggests.
