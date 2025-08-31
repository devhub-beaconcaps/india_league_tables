import ArticleProcessor from "../components/ArticleProcessor";
import Image from "next/image";

export default function Home() {

  console.log("what am i foing here");
  return (
    <div className="bg-blue-500 text-red-200">
      This is my first next js APP

      <ArticleProcessor/>
    </div>
  );
}
