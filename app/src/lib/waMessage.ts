export type WaMessageType = "muslim" | "general";

/**
 * Build the WhatsApp invitation message. Shared by the send route and the
 * preview endpoint so the pratinjau always matches what is actually sent.
 */
export function buildInvitationMessage(opts: {
  guestName: string;
  plusOneName?: string | null;
  invitationLink: string;
  messageType: WaMessageType;
  coupleName: string;
  signOffName: string;
  /** When set (e.g. for wa.me where images can't be attached), adds a note
   *  pointing the guest to their QR entry pass. */
  passLink?: string;
}): string {
  const heart = "\u{1F90D}";
  const pray = "\u{1F64F}";
  const ticket = "\u{1F3AB}";

  // Address the guest and, when present, their partner (plus-one)
  const recipient = opts.plusOneName?.trim()
    ? `*${opts.guestName}* & *${opts.plusOneName.trim()}*`
    : `*${opts.guestName}*`;

  // QR note — only when a pass link is provided (image can't be sent via wa.me)
  const qrNote = opts.passLink
    ? `${ticket} QR code masuk (tiket) Anda ada di halaman berikut — cukup tunjukkan saat tiba di venue:\n${opts.passLink}\n\n`
    : "";

  const digitalNote =
    `Mohon maaf karena undangan ini kami sampaikan dalam bentuk pesan digital. Terima kasih atas perhatian, doa, dan kehadirannya.`;

  const muslimMessage =
    `Assalamualaikum Warahmatullahi Wabarakatuh ${heart}\n\n` +
    `Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i ${recipient} untuk hadir dalam acara pernikahan ${opts.coupleName}.\n\n` +
    `Berikut link undangan kami, untuk info lengkap dari acara bisa kunjungi :\n${opts.invitationLink}\n\n` +
    qrNote +
    `Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir ${pray}\n\n` +
    `${digitalNote}\n\n` +
    `Wassalamualaikum Warahmatullahi Wabarakatuh\n\n` +
    `Hormat Kami,\n${opts.signOffName}`;

  const generalMessage =
    `Kepada Yth. Bapak/Ibu/Saudara/i ${recipient} ${heart}\n\n` +
    `Dengan hormat, perkenankan kami mengundang Anda untuk hadir dalam acara pernikahan ${opts.coupleName}.\n\n` +
    `Berikut link undangan kami, untuk info lengkap dari acara bisa kunjungi :\n${opts.invitationLink}\n\n` +
    qrNote +
    `Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir ${pray}\n\n` +
    `${digitalNote}\n\n` +
    `Hormat Kami,\n${opts.signOffName}`;

  return opts.messageType === "general" ? generalMessage : muslimMessage;
}
