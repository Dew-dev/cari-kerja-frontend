<template>
  <section class="bg-gray-50 py-16 mb-20">
    <div class="max-w-290 mx-auto">
      <h2 class="text-3xl font-bold text-center text-gray-800 mb-2">{{ $t('topCompanies') || 'Top Companies' }}</h2>
      <p class="text-center text-gray-600 mb-12">{{ $t('companiesHiring') || 'Companies actively hiring' }}</p>
      
      <div class="bg-white rounded-xl shadow-md p-8 overflow-hidden">
        <div class="flex gap-8 items-center justify-center flex-wrap">
          <div class="text-center hover:scale-110 transition duration-200 cursor-pointer">
            <div class="h-16 flex items-center justify-center mb-2">
              <span class="text-3xl font-bold text-blue-600">JS</span>
            </div>
            <div class="text-sm font-semibold text-gray-700">JustSchool</div>
          </div>
          <div class="text-center hover:scale-110 transition duration-200 cursor-pointer">
            <div class="h-16 flex items-center justify-center mb-2">
              <span class="text-3xl font-bold text-orange-600">NP</span>
            </div>
            <div class="text-sm font-semibold text-gray-700">Nova Poshta</div>
          </div>
          <div class="text-center hover:scale-110 transition duration-200 cursor-pointer">
            <div class="h-16 flex items-center justify-center mb-2">
              <span class="text-3xl font-bold text-red-600">MC</span>
            </div>
            <div class="text-sm font-semibold text-gray-700">McDonald's</div>
          </div>
          <div class="text-center hover:scale-110 transition duration-200 cursor-pointer">
            <div class="h-16 flex items-center justify-center mb-2">
              <span class="text-3xl font-bold text-purple-600">AU</span>
            </div>
            <div class="text-sm font-semibold text-gray-700">Aurora</div>
          </div>
          <div class="text-center hover:scale-110 transition duration-200 cursor-pointer">
            <div class="h-16 flex items-center justify-center mb-2">
              <span class="text-3xl font-bold text-black">AD</span>
            </div>
            <div class="text-sm font-semibold text-gray-700">Adidas</div>
          </div>
          <div class="text-center hover:scale-110 transition duration-200 cursor-pointer">
            <div class="h-16 flex items-center justify-center mb-2">
              <span class="text-3xl font-bold text-indigo-600">RG</span>
            </div>
            <div class="text-sm font-semibold text-gray-700">Retail Group</div>
          </div>
        </div>
        <div class="text-center mt-8">
          <a href="#" class="text-blue-600 hover:text-blue-700 font-semibold text-sm">{{ $t('browseAllCompanies') || 'Browse all companies' }} →</a>
        </div>
      </div>
    </div>
  </section>
</template>
