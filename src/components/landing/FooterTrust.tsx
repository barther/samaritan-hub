const FooterTrust = () => {
  return (
    <footer className="py-8 border-t border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Transparent. Local. Needs-first. Your gift goes directly to helping neighbors in need.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Good Samaritan at Lithia Springs Methodist Church
          </p>
          <div className="mt-4">
            <a 
              href="mailto:office@lithiaspringsmethodist.org"
              className="text-sm text-primary hover:text-primary-hover underline"
            >
              Contact: office@lithiaspringsmethodist.org
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterTrust;