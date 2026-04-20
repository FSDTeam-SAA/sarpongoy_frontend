import Image from 'next/image'
import Link from 'next/link'

export default function AuthLogo() {
  return (
    <Link
      href="/"
      aria-label="iLearnReady home"
      className="relative mx-auto block h-[72px] w-[240px] overflow-hidden"
    >
      <Image
        src="/images/logo.png"
        alt="iLearnReady"
        width={320}
        height={214}
        priority
        className="absolute left-0 top-0 h-auto w-[320px] max-w-none"
        style={{ transform: 'translate(-44px, -70px)' }}
      />
    </Link>
  )
}
