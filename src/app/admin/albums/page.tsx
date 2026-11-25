import { AlbumList } from "@/components/admin/AlbumList";

export const metadata = { title: "Bộ sưu tập" };

export default async function AdminAlbums({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string }> }) {
  const { error, deleted } = await searchParams;
  return <AlbumList kind="COLLECTION" error={error} deleted={deleted} />;
}
