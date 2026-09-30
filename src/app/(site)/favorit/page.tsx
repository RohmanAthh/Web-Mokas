import type { Metadata } from "next";
import { FavoritesList } from "./FavoritesList";

export const metadata: Metadata = { title: "Favorit Saya", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="mb-8 text-5xl leading-[0.9] font-bold tracking-tighter uppercase sm:text-7xl">
        Garasi <span className="bg-nb-pink px-2">impian ♥</span>
      </h1>
      <FavoritesList />
    </div>
  );
}
