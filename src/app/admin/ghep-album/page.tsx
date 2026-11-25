import { AlbumList } from "@/components/admin/AlbumList";

export const metadata = { title: "Album mẫu" };

export default async function AdminSampleAlbums({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string }> }) {
  const { error, deleted } = await searchParams;
  return <AlbumList kind="SAMPLE" error={error} deleted={deleted} />;
}
