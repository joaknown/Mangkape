import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { SHOP_DETAILS } from '../data/catalog';

interface StoryPhoto {
  src: string;
  era: string;
  title: string;
  caption: string;
}

const ARCHIVE_PHOTOS: StoryPhoto[] = [
  {
    src: '/assets/aistudio/20210206_060228_Original_72fecce1.jpg',
    era: 'Feb 6, 2021',
    title: 'Back of Villareal Stadium · Opening Day',
    caption:
      'Day one behind the pop-up pour-over table at the back of Villareal Stadium—Capiz Robusta, Barako, and Benguet brewed fresh to order.',
  },
  {
    src: '/assets/aistudio/20210206_114507_Original_63fe51a0.jpg',
    era: 'Feb 6, 2021',
    title: 'First Street-Side Customers',
    caption:
      'Serving walkers, joggers, and passersby on our very first day out on the pavement beside Villareal Stadium.',
  },
  {
    src: '/assets/aistudio/20210220_052550_Original_4b6887ba.jpg',
    era: 'Feb 2021',
    title: 'Pre-Dawn at Pueblo de Panay',
    caption:
      'Setting up under canvas tents before sunrise for weekend and holiday morning regulars.',
  },
  {
    src: '/assets/aistudio/20210225_061227_Original_9112d0ea.jpg',
    era: 'Feb 2021',
    title: 'Sunrise Brews at Pueblo de Panay',
    caption:
      'Quiet morning skies and chalkboards at our weekend spot—where regulars encouraged us to open on weekdays.',
  },
  {
    src: '/assets/aistudio/20210313_062027_Original_12dff812.jpg',
    era: 'Mar 2021',
    title: 'Weekend Pour-Over Canopy',
    caption:
      'Pour-over coffee and native Capiz beans served side by side with hot and iced classics.',
  },
  {
    src: '/assets/aistudio/20210313_062142_Original_0d44dfcf.jpg',
    era: 'Mar 2021',
    title: 'Brewing Happiness Together',
    caption:
      'Proudly holding up the Mang Kape badge at Pueblo de Panay as our weekend community grew.',
  },
  {
    src: '/assets/aistudio/FB_IMG_1649601634683_Original_ac25265d.jpg',
    era: 'Happyville Gym',
    title: 'Happyville Academy Covered Gym',
    caption:
      'Our first physical home for nine months—a warm wooden bar and hand-chalked menu inside the covered gym.',
  },
  {
    src: '/assets/aistudio/FB_IMG_1675609562400_Original_4c389d57.jpg',
    era: 'Happyville Gym',
    title: 'Crew Behind the Bar',
    caption:
      'Serving everyday regulars in our covered gym store with a growing espresso, pour-over, and iced coffee lineup.',
  },
  {
    src: '/assets/aistudio/FB_IMG_1675609579844_Original_e9ab4cbe.jpg',
    era: 'Happyville Gym',
    title: 'Coffee & Friends After Dark',
    caption:
      'Warm bulb lights, wooden tables, and the swing wall where friends lingered over evening cups.',
  },
  {
    src: '/assets/aistudio/20220404_143325_Original_dc665135.jpg',
    era: 'Apr 2022',
    title: 'Boulevard Timber Kiosk',
    caption:
      'Moving to the Boulevard in front of SM City Roxas with a custom timber kiosk and bamboo seating.',
  },
  {
    src: '/assets/aistudio/FB_IMG_1669978829936_Original_c417ff27.jpg',
    era: '2022',
    title: 'Expanded Nipa & Bamboo Bar',
    caption:
      'Expanding into a larger Boulevard coffee bar with nipa roofing, warm pendant lights, and full pour-over shelf.',
  },
  {
    src: '/assets/aistudio/20221120_185037_Original_2_2dd4a0c2.jpg',
    era: 'Nov 2022',
    title: 'Boulevard Evening Service',
    caption:
      'Glowing nights at the expanded Boulevard kiosk before finally settling into our permanent Burgos home.',
  },
];

const MILESTONES = [
  {
    era: '2019',
    place: 'Pouches, Drip Bags & Selling Cold Brew',
    summary:
      'Started as a small online coffee business selling ground pouches, drip bags, and cold brew delivered personally.',
    photoIndex: 0,
  },
  {
    era: 'Feb 6, 2021',
    place: 'Back of Villareal Stadium',
    summary:
      'Launched our first pop-up coffee cart serving walkers, joggers, bikers, and passersby.',
    photoIndex: 1,
  },
  {
    era: 'Weekends',
    place: 'Pueblo de Panay',
    summary:
      'Built lasting community bonds as regulars inspired us to find a weekday spot.',
    photoIndex: 5,
  },
  {
    era: '9 Months',
    place: 'Happyville Academy Covered Gym',
    summary:
      'Our first simple physical store where regular customers could visit day to day.',
    photoIndex: 7,
  },
  {
    era: 'Boulevard',
    place: 'In front of SM City Roxas',
    summary:
      'Transferred to the Boulevard and expanded into a larger space nearby to serve growing demand.',
    photoIndex: 10,
  },
  {
    era: 'Today',
    place: 'Burgos, in front of Saint Mary’s Academy',
    summary:
      'Our permanent, welcoming air-conditioned home in Roxas City—years of prayers and perseverance fulfilled.',
    photoIndex: 11,
  },
];

export const StorySection: React.FC = () => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(1);
  const currentPhoto = ARCHIVE_PHOTOS[activePhotoIdx] || ARCHIVE_PHOTOS[0];

  const handlePrev = () => {
    setActivePhotoIdx((prev) => (prev - 1 + ARCHIVE_PHOTOS.length) % ARCHIVE_PHOTOS.length);
  };

  const handleNext = () => {
    setActivePhotoIdx((prev) => (prev + 1) % ARCHIVE_PHOTOS.length);
  };

  return (
    <section id="story" className="py-14 lg:py-20 border-b border-[#E6E2D8]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-medium text-[#4E4842] mb-2">
              Our Journey · Est. 2019 in Roxas City, Capiz
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-semibold text-[#181615] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              A Story of Humble Beginnings
            </h2>
          </div>

          <a
            href={SHOP_DETAILS.storyPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] text-xs font-medium text-[#181615] bg-[#F3F1EC] hover:bg-[#E8E4DA] border border-[#DFD9CC] rounded-lg transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
          >
            <FileText className="w-3.5 h-3.5 text-[#1B3B2B]" />
            <span>Read Original Story PDF</span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Throwback Photo Archive + Journey Timeline */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-[#E6E2D8] overflow-hidden">
              <div className="aspect-[4/3] bg-[#F3F1EC] relative overflow-hidden">
                <img
                  src={currentPhoto.src}
                  alt={currentPhoto.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Clean Caption & Carousel Controls below image */}
              <div className="p-4 border-t border-[#E6E2D8]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono-tabular font-semibold text-[#1B3B2B]">
                    {currentPhoto.era} · {activePhotoIdx + 1} / {ARCHIVE_PHOTOS.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="Previous throwback photo"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-[#DFD9CC] bg-[#FAF9F6] hover:bg-[#EFECE4] text-[#181615] cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Next throwback photo"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-[#DFD9CC] bg-[#FAF9F6] hover:bg-[#EFECE4] text-[#181615] cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#181615]">{currentPhoto.title}</p>
                <p className="text-xs text-[#4E4842] leading-relaxed mt-1">
                  {currentPhoto.caption}
                </p>

                {/* Thumbnail Strip */}
                <div
                  className="mt-3 pt-3 border-t border-[#EFECE4] grid grid-cols-6 gap-1.5"
                  aria-label="Throwback photo gallery thumbnails"
                >
                  {ARCHIVE_PHOTOS.map((photo, idx) => {
                    const isActive = idx === activePhotoIdx;
                    return (
                      <button
                        key={photo.src}
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        aria-label={`View photo ${idx + 1}: ${photo.title}`}
                        aria-current={isActive ? 'true' : undefined}
                        className={`aspect-square rounded-md overflow-hidden border transition-all cursor-pointer ${
                          isActive
                            ? 'border-[#1B3B2B] ring-2 ring-[#1B3B2B]/30'
                            : 'border-[#E6E2D8] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo.src}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-[#F3F1EC] rounded-xl border border-[#E6E2D8] p-6">
              <h3 className="text-sm font-semibold text-[#181615] mb-4">
                Where &amp; When We Started
              </h3>
              <ol className="divide-y divide-[#DFD9CC]">
                {MILESTONES.map((step, index) => (
                  <li key={step.era} className={index === 0 ? 'pb-3.5' : 'py-3.5 last:pb-0'}>
                    <button
                      type="button"
                      onClick={() => setActivePhotoIdx(step.photoIndex)}
                      className="w-full text-left group cursor-pointer"
                    >
                      <div className="flex items-baseline gap-2 text-xs text-[#6B645C] mb-0.5">
                        <span className="font-mono-tabular font-semibold text-[#1B3B2B]">
                          {step.era}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#181615] group-hover:underline">
                          {step.place}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#4E4842]">{step.summary}</p>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right Column: Full Narrative Story */}
          <div className="lg:col-span-7 space-y-5 text-[15px] leading-[1.72] text-[#4E4842]">
            <p>
              Mang Kape began in <strong className="font-semibold text-[#181615]">2019</strong> as a small online business selling coffee grounds in pouches, drip bag coffee, and cold brew coffee. We personally delivered orders to customers and shipped them to different locations, driven by a simple goal: to share good coffee with people.
            </p>

            <p>
              When the pandemic arrived, operations slowed down, but our passion for coffee continued to grow. We dedicated our time to learning about coffee beans, brewing techniques, and equipment, turning a challenging season into an opportunity to deepen our knowledge and appreciation of the craft.
            </p>

            <p>
              On <strong className="font-semibold text-[#181615]">February 6, 2021</strong>, that passion took a new form when we launched Mang Kape as a pop-up coffee cart at the back of <strong className="font-semibold text-[#181615]">Villareal Stadium</strong>. Our mission was simple: to serve freshly brewed coffee to people who were walking, jogging, biking, or simply passing by. We started with hot coffee, and after listening to our customers’ suggestions, we soon added cold drinks to our menu.
            </p>

            <p>
              As our journey continued, we were given the opportunity to operate in <strong className="font-semibold text-[#181615]">Pueblo de Panay</strong> during weekends and holidays. There, we learned an important lesson: building a business is not just about selling products—it is about listening to customers, creating meaningful connections, and building a community. Many regulars often told us,{' '}
              <em className="text-[#181615]">
                “Sir, tani may ara kamo sang lugar nga pwede namon kadtuan bisan weekdays.”
              </em>{' '}
              Their encouragement inspired us to keep moving forward.
            </p>

            <p>
              By God’s grace, a friend’s aunt offered us a space at the covered gym of <strong className="font-semibold text-[#181615]">Happyville Academy</strong> for nine months—our first glimpse of having a physical store. When schools reopened, we moved to the Boulevard in front of <strong className="font-semibold text-[#181615]">SM City Roxas</strong> and later to a larger space nearby. Every move taught us resilience, adaptability, and perseverance.
            </p>

            <p>
              At last, our journey led us to <strong className="font-semibold text-[#181615]">Burgos, in front of Saint Mary’s Academy</strong>—a permanent, welcoming, air-conditioned home where our community can comfortably enjoy good coffee regardless of the weather.
            </p>

            {/* Clean Typographic Pull-Quote (no thick left border) */}
            <blockquote className="my-6 py-6 px-6 bg-[#F3F1EC] rounded-xl border border-[#E6E2D8]">
              <p className="font-display text-lg sm:text-xl font-medium text-[#181615] leading-snug mb-3">
                “You do not need to have everything to begin. You only need the courage to take the first step, the willingness to keep learning, the humility to listen, and the faith to keep moving forward when things do not go as planned.”
              </p>
              <footer className="text-xs font-medium text-[#1B3B2B]">
                Once again, salamat sa padayon nga suporta! All glory belongs to God.
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};
