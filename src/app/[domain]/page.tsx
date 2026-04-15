export default async function TenantPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <h1 className="text-4xl font-bold">Bem vindo à Loja {domain}</h1>
      <p className="mt-4 text-gray-600">Esta é a vitrine do lojista focada em conversão.</p>
    </div>
  );
}
