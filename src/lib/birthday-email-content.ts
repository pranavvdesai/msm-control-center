type BirthdayPerson = { name: string; rollNumber: string };

function firstName(name: string) {
  return name.split(" ")[0];
}

function pickIndex(key: string, poolLength: number): number {
  if (poolLength === 0) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % poolLength;
}

import { getIstDateString } from "@/lib/play/ist-date";

function todayKey() {
  return getIstDateString();
}

/** Short birthday quotes — unique per person per day */
const BIRTHDAY_QUOTES = [
  "Another year bolder, another case study wiser — the cohort cheers for you today.",
  "May your GPA glow and your chai stay strong on this beautiful birthday morning.",
  "Term 4 bends a little today — even attendance feels festive when you were born.",
  "The universe drafted you into MSM for a reason; today we celebrate that plot twist.",
  "From G2 lectures to late-night submissions — you make the batch brighter, {firstName}.",
  "Birthdays at TAPMI hit different: cake, chaos, and classmates who actually show up.",
  "One more lap around the sun, and still the person we’d pick for every group project.",
  "May every surprise quiz miss you today and every friend find you for cake.",
  "Your roll number is legend; your birthday is national news in MSM today.",
  "Another candle, another chapter — write this year loud, {firstName}.",
];

/** Full poems for the birthday person */
function birthdayPoems(firstName: string, rollNumber: string): string[] {
  return [
    `Dear ${firstName}, roll ${rollNumber},<br/><br/>
Today the timetable pauses — just for you.<br/>
Another year of dreams in MBA blue,<br/>
Marketing minds and hearts that stay true.<br/><br/>
May classes feel light, may deadlines be kind,<br/>
May joy find you quickly, may peace fill your mind.<br/>
The whole MSM family sings this refrain:<br/>
<strong>Happy Birthday, ${firstName} — shine on again!</strong>`,

    `${firstName}, on this morning so bright,<br/>
The cohort gathers to share the delight.<br/>
Your laughter in corridors, your spark in the room —<br/>
Today we declare you the star of the bloom.<br/><br/>
From Manipal skies to the dreams you pursue,<br/>
We’re lucky to study and grow beside you.<br/>
So blow out the candles, stand tall, take a bow —<br/>
<strong>Happy Birthday, dear friend — we celebrate you now.</strong>`,

    `A toast to ${firstName}, our MSM pride,<br/>
On this birthday ride, side by side.<br/>
You turn pages of life with courage and grace,<br/>
A warm, steady light in our fast-paced race.<br/><br/>
May fortune be gentle, may friendships stay near,<br/>
May every small wish become crystal clear.<br/>
Ram and the batch send this poem your way —<br/>
<strong>Have the happiest, brightest birthday today!</strong>`,

    `Happy birthday, ${firstName} — listen close:<br/>
You're the punchline we love and the friend we toast most.<br/>
Through presentations, pressure, and Term 4 rain,<br/>
Your spirit keeps lifting us again and again.<br/><br/>
So here’s a small verse from your cohort with care:<br/>
Walk into this year with confidence to spare.<br/>
Roll ${rollNumber}, today belongs to you —<br/>
<strong>MSM stands up and says — we’re proud of you too!</strong>`,

    `${firstName}, the calendar chose you today,<br/>
So MSM pauses its usual fray.<br/>
No case study stress can steal this sweet hour —<br/>
You bloom like a flower in cohort power.<br/><br/>
May kindness surround you, may laughter be loud,<br/>
May you feel every bit as special as proud.<br/>
From morning chai rituals to stars after dusk —<br/>
<strong>Happy Birthday — in you, we trust.</strong>`,

    `For ${firstName}, born to stand out in a crowd,<br/>
Today we say it clearly and proud:<br/>
Your heart is a compass, your smile is a song,<br/>
You’ve carried us gently when days felt too long.<br/><br/>
Another year dawns — fresh canvas, new art —<br/>
Keep painting your story with courage and heart.<br/>
The batch sends this poem on ribbons of light —<br/>
<strong>Happy Birthday, ${firstName} — shine fierce, shine bright.</strong>`,

    `Roll ${rollNumber}, today is your day,<br/>
And MSM has something poetic to say:<br/>
You’re chapters of kindness in our shared book,<br/>
The friend we all search for with just one look.<br/><br/>
May blessings pour softly, may goals feel near,<br/>
May this new age welcome you without fear.<br/>
So dance through the hours however you please —<br/>
<strong>Happy Birthday, ${firstName} — take all the ease.</strong>`,

    `${firstName}, like monsoon after heat,<br/>
Your birthday makes ordinary hours sweet.<br/>
You’ve shared notes, shared jokes, shared quiet support —<br/>
Today we return love of the wholehearted sort.<br/><br/>
Stand tall in the spotlight — you’ve earned every line<br/>
Of this little poem from your MSM tribe.<br/>
May joy wrap around you in gold and in blue —<br/>
<strong>The cohort shouts loudly: Happy Birthday to you!</strong>`,
  ];
}

/** Poetic messages for classmates about a birthday person */
function classmatePoemsAbout(birthdayName: string, birthdayRoll: string): string[] {
  const fn = firstName(birthdayName);
  return [
    `Today ${fn} (${birthdayRoll}) adds another candle to the MSM constellation — wish them warmth before the first lecture ends.`,
    `${fn} walks into class today with extra stardust — buy them chai, steal a smile, make the moment count.`,
    `The batch owes ${fn} a chorus of happy birthdays — their kindness shows up long after the slides close.`,
    `On ${fn}'s birthday, even attendance feels festive; find them, hug them, remind them they matter here.`,
    `${fn} turns the ordinary TAPMI morning into celebration — one genuine wish from you can make their whole day.`,
    `Roll ${birthdayRoll} belongs to someone we admire — ${fn} deserves cake, laughter, and a room full of cheer.`,
    `Let’s flood ${fn} with birthday poetry today: they’ve been the calm in our chaos all Term 4 long.`,
    `${fn} was born on a day the universe got clever — celebrate them loudly between classes and chai breaks.`,
    `Send ${fn} a wish as bright as their presence — birthdays like this are rare gifts for the whole cohort.`,
    `Today we honour ${fn}: student, friend, legend-in-progress — make sure they hear your voice in the chorus.`,
    `${fn}'s birthday is MSM headline news — show up for them the way they’ve shown up for this batch.`,
    `Find ${fn} before sunset and offer a wish worth remembering — great people deserve great birthdays.`,
  ];
}

/** Extra cohort quotes for classmates — unique per recipient */
const CLASSMATE_QUOTES = [
  "Birthdays remind us: we’re not just a batch — we’re a little family with inside jokes and shared deadlines.",
  "One wish from you can turn someone’s whole day golden — don’t leave it unsaid.",
  "MSM runs on marketing minds and generous hearts — today, lead with the generous part.",
  "Term 4 is tough; celebrating each other is how we keep the cohort human.",
  "A birthday in class is the universe asking us to pause and be kind on purpose.",
  "Good friends don’t wait for reminders — they show up with smiles and stupid jokes.",
  "The best gift you can give today costs nothing: your time, your warmth, your attention.",
  "We’ll forget some lectures; we’ll remember who made us feel seen on days like this.",
];

function wrapEmail(title: string, bodyHtml: string) {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; background: #030014; color: #f4f4f5; padding: 32px; border-radius: 16px;">
      <p style="font-family: system-ui, sans-serif; color: #22d3ee; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">MSM Control Center · Cake Radar</p>
      <h1 style="font-size: 26px; margin: 16px 0; line-height: 1.35;">${title}</h1>
      ${bodyHtml}
      <p style="font-family: system-ui, sans-serif; color: #52525b; font-size: 11px; margin-top: 32px;">
        MSM Control Center · TAPMI Manipal · Term 4
      </p>
    </div>
  `;
}

export function buildBirthdayPersonEmail(
  person: BirthdayPerson,
  subjectPrefix: string
): { subject: string; html: string } {
  const fn = firstName(person.name);
  const dateKey = todayKey();
  const poem = birthdayPoems(fn, person.rollNumber)[
    pickIndex(`${person.rollNumber}:${dateKey}:poem`, birthdayPoems(fn, person.rollNumber).length)
  ];
  const quoteTemplate =
    BIRTHDAY_QUOTES[pickIndex(`${person.rollNumber}:${dateKey}:quote`, BIRTHDAY_QUOTES.length)];
  const quote = quoteTemplate.replace(/\{firstName\}/g, fn);

  const html = wrapEmail(
    `🎂 Happy Birthday, ${fn}!`,
    `
      <p style="color: #a1a1aa; line-height: 1.7; font-family: system-ui, sans-serif;">
        Dear <strong style="color: white;">${person.name}</strong> — the whole MSM cohort celebrates you today.
      </p>
      <div style="margin: 24px 0; padding: 20px; background: #0a0a1a; border-radius: 12px; border: 1px solid #fbbf2433;">
        <p style="margin: 0 0 8px; color: #fbbf24; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-family: system-ui, sans-serif;">A poem for you</p>
        <p style="margin: 0; color: #e4e4e7; line-height: 1.9; font-style: italic; font-size: 15px;">${poem}</p>
      </div>
      <div style="margin: 24px 0; padding: 16px; background: #0a0a1a; border-radius: 12px; border-left: 3px solid #22d3ee;">
        <p style="margin: 0; color: #d4d4d8; line-height: 1.7; font-size: 14px;">"${quote}"</p>
      </div>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.7; font-family: system-ui, sans-serif;">
        Walk into class like the main character you are. Your batch is cheering for you — always.
      </p>
    `
  );

  return {
    subject: `${subjectPrefix}🎂 Happy Birthday ${fn}! — A poem from MSM`,
    html,
  };
}

export function buildClassmateBirthdayEmail(
  birthdayPeople: BirthdayPerson[],
  recipient: BirthdayPerson,
  subjectPrefix: string
): { subject: string; html: string } {
  const dateKey = todayKey();
  const names = birthdayPeople.map((p) => firstName(p.name)).join(" & ");
  const recipientFn = firstName(recipient.name);

  const personBlocks = birthdayPeople
    .map((bp) => {
      const pool = classmatePoemsAbout(bp.name, bp.rollNumber);
      const message = pool[pickIndex(`${recipient.rollNumber}:${bp.rollNumber}:${dateKey}`, pool.length)];
      return `
        <div style="margin: 16px 0; padding: 16px; background: #0a0a1a; border-radius: 12px; border: 1px solid #22d3ee22;">
          <p style="margin: 0 0 6px; color: #22d3ee; font-size: 12px; font-family: system-ui, sans-serif;">For ${firstName(bp.name)} · ${bp.rollNumber}</p>
          <p style="margin: 0; color: #d4d4d8; line-height: 1.8; font-style: italic; font-size: 14px;">${message}</p>
        </div>
      `;
    })
    .join("");

  const cohortQuote =
    CLASSMATE_QUOTES[pickIndex(`${recipient.rollNumber}:${dateKey}:cohort`, CLASSMATE_QUOTES.length)];

  const title =
    birthdayPeople.length === 1
      ? `🎉 Today we celebrate ${firstName(birthdayPeople[0].name)}!`
      : `🎉 Birthday joy for ${names}!`;

  const html = wrapEmail(
    title,
    `
      <p style="color: #a1a1aa; line-height: 1.7; font-family: system-ui, sans-serif;">
        Hi <strong style="color: white;">${recipientFn}</strong> — MSM Cake Radar has birthday news for your class today.
      </p>
      ${personBlocks}
      <div style="margin: 24px 0; padding: 16px; background: linear-gradient(135deg, #22d3ee11, #8b5cf611); border-radius: 12px;">
        <p style="margin: 0; color: #e4e4e7; line-height: 1.8; font-style: italic; font-size: 14px;">"${cohortQuote}"</p>
      </div>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.7; font-family: system-ui, sans-serif;">
        Wish them in class, share chai, and remind them the cohort is family. 😄
      </p>
    `
  );

  const subject =
    birthdayPeople.length === 1
      ? `${subjectPrefix}🎂 Wish ${firstName(birthdayPeople[0].name)} a poetic happy birthday!`
      : `${subjectPrefix}🎂 ${birthdayPeople.length} MSM birthdays today — send your wishes!`;

  return { subject, html };
}

/** Plain-text poem for in-app birthday splash (strips HTML from email poems). */
export function getBirthdayPersonPoemPlain(
  person: BirthdayPerson,
  dateKey = getIstDateString()
): string {
  const fn = firstName(person.name);
  const poems = birthdayPoems(fn, person.rollNumber);
  const html = poems[pickIndex(`${person.rollNumber}:${dateKey}:poem`, poems.length)];
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?strong>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}
