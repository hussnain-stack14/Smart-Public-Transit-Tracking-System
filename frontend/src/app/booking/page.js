import BookingPage from "../../components/booking/BookingPage";

export const metadata = {
  title: "Booking | Smart Transit Faisalabad",
  description: "Choose a route and bus to start reserving a transit seat.",
};

export default async function BookingRoute({ searchParams }) {
  const params = await searchParams;
  return <BookingPage initialBusId={params?.bus || ""} initialRouteId={params?.route || ""} />;
}
