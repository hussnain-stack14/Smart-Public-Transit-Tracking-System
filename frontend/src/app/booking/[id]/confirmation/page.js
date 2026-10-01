import ConfirmationPage from "../../../../components/booking/ConfirmationPage";

export async function generateMetadata() {
  return { title: "Booking Confirmation | Smart Safar Faisalabad" };
}

export default async function ConfirmationRoute({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  return <ConfirmationPage bookingId={query?.booking || id} />;
}
