import { Button, Heading, Html, Text } from "@react-email/components";

export default function OrderConfirmationEmail({
  orderId,
  total,
}: {
  orderId: string;
  total: string;
}) {
  return (
    <Html>
      <Heading as="h1">Order confirmed</Heading>
      <Text>Thank you — your ShopWell order {orderId} is confirmed.</Text>
      <Text>Total: {total}</Text>
      <Button href="https://shopwell.example">View orders</Button>
    </Html>
  );
}
