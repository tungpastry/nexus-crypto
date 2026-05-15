import { notFound } from "next/navigation";
import { findAssetById } from "../../config/assets";
import AssetWorkspaceShell from "../../components/asset/AssetWorkspaceShell";

type AssetPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params;
  const asset = findAssetById(id);

  if (!asset) notFound();

  return <AssetWorkspaceShell asset={asset} />;
}
