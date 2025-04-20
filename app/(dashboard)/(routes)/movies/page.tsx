import { Heading } from "@/components/ui/heading";
import { MoviesClient } from "./components/client";

const MoviesPage = () => {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Heading
        title="Movies Management"
        description="Browse, filter, and manage your movie collection"
        separator={true}
      />
      <MoviesClient />
    </div>
  );
}
 
export default MoviesPage;