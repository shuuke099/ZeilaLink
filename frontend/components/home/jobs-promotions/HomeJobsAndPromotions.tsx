import JobsNearYou from "./JobsNearYou";
import GetFeaturedCard from "./GetFeaturedCard";
import ZeilaMartCard from "./ZeilaMartCard";

export default function HomeJobsAndPromotions() {
  return (
    <section className="w-full bg-white pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_0.75fr_1fr]">
          <JobsNearYou />
          <GetFeaturedCard />
          <ZeilaMartCard />
        </div>
      </div>
    </section>
  );
}
