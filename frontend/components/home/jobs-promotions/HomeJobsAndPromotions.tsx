import JobsNearYou from "./JobsNearYou";

export default function HomeJobsAndPromotions() {
  return (
    <section className="w-full bg-white pb-10">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-8 xl:px-12">
        <JobsNearYou />
      </div>
    </section>
  );
}
