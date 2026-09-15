import SeatSelectionPage from "../../../../components/booking/SeatSelectionPage";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Seat Selection | Smart Transit Faisalabad`, description: `Choose a seat for bus ${id}.` };
}

export default async function SeatSelectionRoute({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  return <SeatSelectionPage busId={id} travelDate={query?.date || ""} />;
}
