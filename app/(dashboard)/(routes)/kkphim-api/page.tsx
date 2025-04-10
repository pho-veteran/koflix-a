import { Heading } from "@/components/ui/heading";
import { KKApiClient } from "./components/client";

const KKApiPage = () => {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Heading
        title="KKPhim API"
        description="Manage and get content from KKPhim"
        separator={true}
      />
      
      <KKApiClient />
    </div>
  );
}

export default KKApiPage;