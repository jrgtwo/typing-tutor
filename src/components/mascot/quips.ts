/**
 * Static raccoon copy bank, split out of RaccoonCameos so the trigger
 * machinery and the writing can evolve independently. v2 will swap the
 * lookup for a generated source when raccoon.dynamic ships.
 */

export type Mood = 'neutral' | 'judgy' | 'smug' | 'pleased' | 'shook';

export type Trigger =
  | 'session_start'
  | 'session_finish'
  | 'idle'
  | 'error_spike';

export interface Quip {
  mood: Mood;
  text: string;
}

export const GREETING_QUIPS: Quip[] = [
  { mood: 'neutral', text: "oh. it's you." },
  { mood: 'smug', text: 'back for more?' },
  { mood: 'neutral', text: "whenever you're ready." },
  { mood: 'judgy', text: "let's see what you've got." },
  { mood: 'smug', text: "couldn't stay away, huh." },
  { mood: 'neutral', text: 'fingers warm? good.' },
  { mood: 'judgy', text: 'no warmup today?' },
  { mood: 'pleased', text: 'ah. a challenger.' },
  { mood: 'neutral', text: "try not to embarrass us." },
  { mood: 'smug', text: "i've been waiting." },
  { mood: 'judgy', text: 'posture. think about it.' },
  { mood: 'neutral', text: 'clock starts when you do.' },
  { mood: 'shook', text: 'oh — already? okay.' },
  { mood: 'smug', text: "let's not waste my time." },
  { mood: 'neutral', text: 'home row. find it.' },
  { mood: 'judgy', text: 'wrists. lift them.' },
  { mood: 'smug', text: "look who's procrastinating productively." },
  { mood: 'neutral', text: "i'll be over here. judging silently." },
  { mood: 'judgy', text: 'caps lock check. i mean it.' },
  { mood: 'pleased', text: 'fresh keyboard energy. love it.' },
  { mood: 'shook', text: 'you came back. wild.' },
  { mood: 'smug', text: 'another round. brave of you.' },
  { mood: 'neutral', text: 'pick a pace. commit to it.' },
  { mood: 'judgy', text: 'thumbs on the spacebar. only.' },
  { mood: 'neutral', text: 'show me something.' },
  { mood: 'smug', text: 'hope you stretched.' },
  { mood: 'judgy', text: "we're not hunting and pecking today." },
  { mood: 'pleased', text: "okay. let's cook." },
  { mood: 'neutral', text: 'screen brightness ok? cool.' },
  { mood: 'smug', text: 'last time was rough. fresh start.' },
];

export const IDLE_QUIPS: Quip[] = [
  { mood: 'neutral', text: "still here. don't mind me." },
  { mood: 'judgy', text: "that's a word, technically." },
  { mood: 'smug', text: 'pacing yourself. bold.' },
  { mood: 'neutral', text: "keep going. or don't." },
  { mood: 'smug', text: "i've seen faster. allegedly." },
  { mood: 'judgy', text: 'are we typing or napping?' },
  { mood: 'neutral', text: 'breathe. then keep going.' },
  { mood: 'smug', text: 'cute pace.' },
  { mood: 'judgy', text: "that key's not haunted." },
  { mood: 'neutral', text: 'you got this. probably.' },
  { mood: 'smug', text: 'taking the scenic route, i see.' },
  { mood: 'shook', text: "oh you're still going. good." },
  { mood: 'judgy', text: 'spelling is a suggestion now?' },
  { mood: 'neutral', text: 'eyes up. words go forward.' },
  { mood: 'smug', text: "this is a marathon for you, isn't it." },
  { mood: 'pleased', text: 'rhythm. nice.' },
  { mood: 'judgy', text: 'less staring, more typing.' },
  { mood: 'neutral', text: 'one word at a time.' },
  { mood: 'smug', text: 'glaciers move faster. but go off.' },
  { mood: 'judgy', text: 'the cursor is blinking. at you.' },
  { mood: 'neutral', text: "don't think. just type." },
  { mood: 'shook', text: 'is something wrong?' },
  { mood: 'smug', text: 'savoring it, are we.' },
  { mood: 'pleased', text: "okay you're in the zone. nice." },
  { mood: 'judgy', text: 'left hand. it has fingers too.' },
  { mood: 'neutral', text: "second wind's right around the corner." },
  { mood: 'smug', text: "i'm not bored. you're bored." },
  { mood: 'judgy', text: 'we lost the rhythm. find it.' },
  { mood: 'neutral', text: "just words. they can't hurt you." },
  { mood: 'shook', text: 'oh. i thought you stopped.' },
  { mood: 'smug', text: "i'll wait. i have nothing else." },
  { mood: 'judgy', text: 'fingers, not knuckles.' },
  { mood: 'pleased', text: 'flow state? almost?' },
  { mood: 'neutral', text: "don't overthink the next one." },
];

export const ERROR_QUIPS: Quip[] = [
  { mood: 'judgy', text: 'hmm.' },
  { mood: 'shook', text: 'what was that.' },
  { mood: 'judgy', text: 'try reading first.' },
  { mood: 'smug', text: 'interesting choice.' },
  { mood: 'shook', text: 'oof.' },
  { mood: 'judgy', text: 'on purpose?' },
  { mood: 'smug', text: 'collecting typos for fun?' },
  { mood: 'judgy', text: 'slow down, champ.' },
  { mood: 'shook', text: 'ow. my eyes.' },
  { mood: 'smug', text: 'creative spelling.' },
  { mood: 'judgy', text: "the keys haven't moved." },
  { mood: 'shook', text: 'wait what.' },
  { mood: 'judgy', text: 'reset. focus.' },
  { mood: 'smug', text: "keep going, i'm taking notes." },
  { mood: 'judgy', text: 'breathe through it.' },
  { mood: 'shook', text: 'rude.' },
  { mood: 'judgy', text: 'that letter exists. you just missed it.' },
  { mood: 'smug', text: 'avant-garde typing. interesting.' },
  { mood: 'shook', text: 'did the keyboard move?' },
  { mood: 'judgy', text: 'shift. it does things.' },
  { mood: 'smug', text: 'a bold misspelling.' },
  { mood: 'judgy', text: 'less caffeine. or more. one of those.' },
  { mood: 'shook', text: 'physically painful.' },
  { mood: 'smug', text: "you're freestyling now." },
  { mood: 'judgy', text: 'the prompt. read it. again.' },
  { mood: 'shook', text: 'how.' },
  { mood: 'judgy', text: 'fingers crossed? uncross them.' },
  { mood: 'smug', text: 'a personal touch.' },
  { mood: 'judgy', text: 'this is a typing app. not jazz.' },
  { mood: 'shook', text: 'okay okay okay. recover.' },
  { mood: 'smug', text: 'redefining the language.' },
  { mood: 'judgy', text: 'eyes on the words. not the keys.' },
];

export const FINISH_SLOPPY: Quip[] = [
  { mood: 'judgy', text: 'a bold interpretation.' },
  { mood: 'judgy', text: 'spelling is a suggestion, apparently.' },
  { mood: 'smug', text: 'avant-garde. confusing. but avant-garde.' },
  { mood: 'judgy', text: 'accuracy is a virtue. allegedly.' },
  { mood: 'shook', text: 'the words. they had a shape.' },
];

export const FINISH_BLAZING: Quip[] = [
  { mood: 'pleased', text: 'okay okay okay. show-off.' },
  { mood: 'pleased', text: 'fingers like little hammers. concerning.' },
  { mood: 'shook', text: 'who hurt you. and how fast.' },
  { mood: 'pleased', text: 'absurd. i love it. tell no one.' },
  { mood: 'smug', text: 'fine. you may brag. once.' },
];

export const FINISH_FAST: Quip[] = [
  { mood: 'pleased', text: "fine. that was fine. don't gloat." },
  { mood: 'pleased', text: 'crisp. unsettlingly crisp.' },
  { mood: 'neutral', text: 'respectable. moving on.' },
  { mood: 'smug', text: "i'll mark you down as competent." },
  { mood: 'pleased', text: 'decent hands. decent brain. decent.' },
];

export const FINISH_MID: Quip[] = [
  { mood: 'neutral', text: "acceptable. i'll allow it." },
  { mood: 'neutral', text: 'serviceable. like a hotel pen.' },
  { mood: 'smug', text: 'not bad. not great. not nothing.' },
  { mood: 'judgy', text: 'middle of the road. literally.' },
  { mood: 'neutral', text: 'a passing grade. barely sparkling.' },
  { mood: 'smug', text: 'adequate. the highest praise i give.' },
];

export const FINISH_SLOW: Quip[] = [
  { mood: 'smug', text: 'we got there. eventually.' },
  { mood: 'judgy', text: 'a leisurely stroll through the alphabet.' },
  { mood: 'smug', text: 'no notes. except: faster.' },
  { mood: 'judgy', text: 'turtles texted. they want their pace back.' },
  { mood: 'neutral', text: 'savored every keystroke, did we.' },
  { mood: 'smug', text: 'unhurried. like a tax audit.' },
];

export const FINISH_GLACIAL: Quip[] = [
  { mood: 'judgy', text: 'glaciers finished sooner.' },
  { mood: 'smug', text: 'a meditation, really. on time.' },
  { mood: 'shook', text: 'are the keys okay?' },
  { mood: 'judgy', text: 'i made a sandwich. i ate the sandwich.' },
];

export function pickOne<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

/** Choose the right finish-pool given a session result. */
export function pickFinishQuip(wpm: number, accuracy: number): Quip {
  let pool: Quip[];
  if (accuracy < 0.85) pool = FINISH_SLOPPY;
  else if (wpm >= 80 && accuracy > 0.97) pool = FINISH_BLAZING;
  else if (wpm >= 60 && accuracy > 0.95) pool = FINISH_FAST;
  else if (wpm < 15) pool = FINISH_GLACIAL;
  else if (wpm < 30) pool = FINISH_SLOW;
  else pool = FINISH_MID;
  return pickOne(pool);
}
