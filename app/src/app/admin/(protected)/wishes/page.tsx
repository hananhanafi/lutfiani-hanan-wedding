import WishesWall from "@/components/WishesWall";

export default function WishesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dinding Harapan</h1>
      <WishesWall isAdmin={true} />
    </div>
  );
}
