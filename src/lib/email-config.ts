/** Official MSM Control Center email — all automated mail sends from here. */
export const MSM_EMAIL_ADDRESS = "msm.tapmi@gmail.com";
export const MSM_EMAIL_FROM = `MSM Control Center <${MSM_EMAIL_ADDRESS}>`;
export const MSM_EMAIL_REPLY_TO = MSM_EMAIL_ADDRESS;
export const MSM_VAPID_SUBJECT = `mailto:${MSM_EMAIL_ADDRESS}`;

export const MSM_EMAIL_FOOTER = `
  <p style="color: #52525b; font-size: 11px; margin-top: 28px; line-height: 1.6; text-align: center;">
    Automated message · MSM Control Center · TAPMI Manipal<br/>
    Sent from ${MSM_EMAIL_ADDRESS}
  </p>
`;
