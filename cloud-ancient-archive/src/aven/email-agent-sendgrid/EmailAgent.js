const cuid = require('cuid');

const sg = require('@sendgrid/mail');

export default function EmailAgent({ config, defaultFromEmail, name }) {
  const { sendgridAPIKey } = config;
  name = name || `email-sendgrid-${cuid()}`;

  sg.setApiKey(sendgridAPIKey);

  async function SendEmail({
    to,
    subject,
    message,
    messageHTML,
    from,
    fromName,
  }) {
    const finalFromEmail = from ? `${fromName} <${from}>` : defaultFromEmail;

    await sg.send({
      to,
      from: finalFromEmail,
      subject,
      text: message,
      html: messageHTML,
    });
  }

  async function SendEmailTemplate(template, recipient, params, opts = {}) {
    const messageHTML = template.getBodyHTML(params);
    const message = template.getBodyText(params);
    const subject = template.getSubject(params);
    await SendEmail({
      to: recipient,
      subject,
      message,
      messageHTML,
      from: opts.from,
      fromName: opts.fromName,
    });
  }

  const actions = {
    SendEmail,
    SendEmailTemplate,
  };

  return { actions, remove: () => {}, name };
}
