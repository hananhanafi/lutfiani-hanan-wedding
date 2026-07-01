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
}): string {
  const heart = "\u{1F90D}";
  const pray = "\u{1F64F}";

  // Address the guest and, when present, their partner (plus-one)
  const recipient = opts.plusOneName?.trim()
    ? `*${opts.guestName}* & *${opts.plusOneName.trim()}*`
    : `*${opts.guestName}*`;

  const muslimMessage =
    `Assalamualaikum Warahmatullahi Wabarakatuh ${heart}\n\n` +
    `Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i ${recipient} untuk hadir dalam acara pernikahan ${opts.coupleName}.\n\n` +
    `Berikut link undangan kami, untuk info lengkap dari acara bisa kunjungi :\n${opts.invitationLink}\n\n` +
    `Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir ${pray}\n\n` +
    `Wassalamualaikum Warahmatullahi Wabarakatuh\n\n` +
    `Hormat Kami,\n${opts.signOffName}`;

  const generalMessage =
    `Kepada Yth. Bapak/Ibu/Saudara/i ${recipient} ${heart}\n\n` +
    `Dengan hormat, perkenankan kami mengundang Anda untuk hadir dalam acara pernikahan ${opts.coupleName}.\n\n` +
    `Berikut link undangan kami, untuk info lengkap dari acara bisa kunjungi :\n${opts.invitationLink}\n\n` +
    `Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir ${pray}\n\n` +
    `Terima kasih.\n\n` +
    `Hormat Kami,\n${opts.signOffName}`;

  return opts.messageType === "general" ? generalMessage : muslimMessage;
}
