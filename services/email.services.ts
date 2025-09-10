export const sendEmail = (props: {
  email: string;
  subject: string;
  message: string;
}) => {
  console.info(
    `EMAIL : ${props.email}, SUBJECT : ${props.subject}, MESSAGE : ${props.message}`,
  );
};
